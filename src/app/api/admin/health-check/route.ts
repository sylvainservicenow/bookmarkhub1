import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/admin'

// Manual health check for a single bookmark
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const supabase = createAdminClient()
  
  // Check if admin
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()
  
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  
  const { bookmarkId } = await request.json()
  
  if (!bookmarkId) {
    return NextResponse.json({ error: 'Bookmark ID required' }, { status: 400 })
  }
  
  // Get the bookmark
  const { data: bookmark, error: fetchError } = await supabase
    .from('bookmarks')
    .select('id, url, failure_count, status')
    .eq('id', bookmarkId)
    .single()
  
  if (fetchError || !bookmark) {
    return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
  }
  
  try {
    const startTime = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
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
      isAccessible = (httpStatus >= 200 && httpStatus < 400) || httpStatus === 405
      
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
    
    // Update bookmark
    let newStatus = bookmark.status
    let newFailureCount = bookmark.failure_count || 0
    
    if (isAccessible) {
      newFailureCount = 0
      if (bookmark.status.startsWith('health_warning')) {
        newStatus = 'active'
      }
    } else {
      newFailureCount++
      if (newFailureCount >= 3) {
        newStatus = 'health_warning_3'
      } else if (newFailureCount === 2) {
        newStatus = 'health_warning_2'
      } else {
        newStatus = 'health_warning_1'
      }
    }
    
    await supabase
      .from('bookmarks')
      .update({
        last_health_check: new Date().toISOString(),
        failure_count: newFailureCount,
        status: newStatus,
      })
      .eq('id', bookmark.id)
    
    return NextResponse.json({
      success: true,
      isAccessible,
      httpStatus,
      responseTime,
      errorMessage,
      newStatus,
      newFailureCount,
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
