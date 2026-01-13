import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Health check timeout in milliseconds
const CHECK_TIMEOUT = 30000

// Batch size for processing bookmarks
const BATCH_SIZE = 50

// Vercel cron job - runs daily at 7am Sydney time (20:00 UTC previous day)
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/health-check", "schedule": "0 20 * * *" }] }
export const maxDuration = 300 // 5 minutes max for cron job

export async function GET(request: NextRequest) {
  // Verify cron secret or admin authorization
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // Allow Vercel cron (via CRON_SECRET) or check for admin session
  const isVercelCron = authHeader === `Bearer ${cronSecret}`
  
  if (!isVercelCron && !cronSecret) {
    // If no cron secret configured, require admin auth
    // This allows manual triggering from admin dashboard
    const supabaseAuth = createAdminClient()
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: user } = await supabaseAuth
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
  }
  
  const supabase = createAdminClient()
  const results = {
    checked: 0,
    healthy: 0,
    failed: 0,
    duplicatesFound: 0,
    errors: [] as string[],
  }
  
  try {
    // Get all active/checked bookmarks that need health check
    // Skip archived, hidden, and submitted (not yet reviewed)
    const { data: bookmarks, error: fetchError } = await supabase
      .from('bookmarks')
      .select('id, url, failure_count, status')
      .in('status', ['active', 'checked', 'health_warning_1', 'health_warning_2', 'health_warning_3'])
      .order('last_health_check', { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE)
    
    if (fetchError) {
      throw new Error(`Failed to fetch bookmarks: ${fetchError.message}`)
    }
    
    if (!bookmarks || bookmarks.length === 0) {
      return NextResponse.json({ message: 'No bookmarks to check', results })
    }
    
    // Check each bookmark
    for (const bookmark of bookmarks) {
      try {
        const startTime = Date.now()
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT)
        
        let isAccessible = false
        let httpStatus: number | null = null
        let errorMessage: string | null = null
        
        try {
          const response = await fetch(bookmark.url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
              'User-Agent': 'BookmarkHub-HealthCheck/1.0'
            },
            redirect: 'follow'
          })
          
          clearTimeout(timeoutId)
          httpStatus = response.status
          
          // Consider 2xx and 3xx as accessible
          // Also accept 405 (Method Not Allowed) as some sites don't allow HEAD
          isAccessible = (httpStatus >= 200 && httpStatus < 400) || httpStatus === 405
          
          // If HEAD fails with 405, try GET
          if (httpStatus === 405) {
            const getResponse = await fetch(bookmark.url, {
              method: 'GET',
              signal: controller.signal,
              headers: {
                'User-Agent': 'BookmarkHub-HealthCheck/1.0'
              },
              redirect: 'follow'
            })
            httpStatus = getResponse.status
            isAccessible = httpStatus >= 200 && httpStatus < 400
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            errorMessage = 'Request timeout'
          } else {
            errorMessage = fetchError.message || 'Unknown fetch error'
          }
        }
        
        const responseTime = Date.now() - startTime
        
        // Log the health check
        await supabase.from('health_check_logs').insert({
          bookmark_id: bookmark.id,
          http_status: httpStatus,
          response_time_ms: responseTime,
          is_accessible: isAccessible,
          error_message: errorMessage,
        })
        
        // Update bookmark status based on result
        let newStatus = bookmark.status
        let newFailureCount = bookmark.failure_count || 0
        
        if (isAccessible) {
          // Reset failure count on success
          newFailureCount = 0
          // If it was in warning state, set back to active/checked
          if (bookmark.status.startsWith('health_warning')) {
            newStatus = 'active'
          }
          results.healthy++
        } else {
          // Increment failure count
          newFailureCount++
          results.failed++
          
          // Update status based on consecutive failures
          if (newFailureCount >= 3) {
            newStatus = 'health_warning_3'
          } else if (newFailureCount === 2) {
            newStatus = 'health_warning_2'
          } else if (newFailureCount === 1) {
            newStatus = 'health_warning_1'
          }
        }
        
        // Update the bookmark
        await supabase
          .from('bookmarks')
          .update({
            last_health_check: new Date().toISOString(),
            failure_count: newFailureCount,
            status: newStatus,
          })
          .eq('id', bookmark.id)
        
        results.checked++
      } catch (bookmarkError: any) {
        results.errors.push(`Bookmark ${bookmark.id}: ${bookmarkError.message}`)
      }
    }
    
    // Check for duplicates
    const duplicatesResult = await checkForDuplicates(supabase)
    results.duplicatesFound = duplicatesResult.found
    
    return NextResponse.json({
      message: 'Health check completed',
      results,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, results },
      { status: 500 }
    )
  }
}

async function checkForDuplicates(supabase: any) {
  // Find bookmarks with duplicate normalized URLs
  const { data: duplicates, error } = await supabase
    .rpc('find_duplicate_urls')
  
  if (error) {
    // Function might not exist yet, create it
    await supabase.rpc('create_find_duplicates_function').catch(() => {})
    return { found: 0 }
  }
  
  let found = 0
  
  if (duplicates && duplicates.length > 0) {
    for (const dup of duplicates) {
      // Check if this pair already exists
      const { data: existing } = await supabase
        .from('duplicate_candidates')
        .select('id')
        .eq('bookmark_id', dup.bookmark_id)
        .eq('duplicate_of_id', dup.duplicate_of_id)
        .maybeSingle()
      
      if (!existing) {
        await supabase.from('duplicate_candidates').insert({
          bookmark_id: dup.bookmark_id,
          duplicate_of_id: dup.duplicate_of_id,
          similarity_score: 100,
        })
        found++
      }
    }
  }
  
  return { found }
}

// POST endpoint for manual trigger from admin
export async function POST(request: NextRequest) {
  return GET(request)
}
