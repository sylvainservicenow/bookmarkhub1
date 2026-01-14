import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Vercel cron job - runs daily at 5am UTC
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/refresh-homepage-cache", "schedule": "0 5 * * *" }] }
export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const supabase = createAdminClient()
  const results: Record<string, any> = {}
  
  try {
    // 1. Update bookmark count stat
    const { count: bookmarkCount } = await supabase
      .from('bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
    
    await supabase
      .from('homepage_stats')
      .upsert({
        stat_key: 'bookmark_count',
        stat_value: bookmarkCount || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'stat_key' })
    
    results.bookmark_count = bookmarkCount
    
    // 2. Cache trending bookmarks (top 3 by clicks)
    const { data: trendingBookmarks } = await supabase
      .from('bookmarks')
      .select(`
        id,
        title,
        url,
        description,
        favicon_url,
        click_count,
        created_at,
        creator_id,
        users!bookmarks_creator_id_fkey(name),
        bookmark_tags(tags(id, name)),
        ratings(rating)
      `)
      .eq('status', 'active')
      .eq('visibility', 'public')
      .order('click_count', { ascending: false })
      .limit(3)
    
    await supabase
      .from('homepage_cache')
      .upsert({
        cache_key: 'trending_bookmarks',
        data: trendingBookmarks || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'cache_key' })
    
    results.trending_count = trendingBookmarks?.length || 0
    
    // 3. Cache top rated bookmarks (top 3)
    // First get the top rated IDs using the efficient RPC
    const { data: topRatedIds } = await supabase
      .rpc('get_top_rated_bookmarks', { limit_count: 3 })
    
    let topRatedBookmarks: any[] = []
    
    if (topRatedIds && topRatedIds.length > 0) {
      const bookmarkIds = topRatedIds.map((r: any) => r.id)
      
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select(`
          id,
          title,
          url,
          description,
          favicon_url,
          creator_id,
          users!bookmarks_creator_id_fkey(name),
          bookmark_tags(tags(id, name))
        `)
        .in('id', bookmarkIds)
      
      // Merge rating data with bookmark data
      topRatedBookmarks = topRatedIds.map((r: any) => {
        const bookmark = bookmarks?.find((b: any) => b.id === r.id)
        return {
          ...bookmark,
          avgRating: parseFloat(r.avg),
          ratingCount: parseInt(r.count)
        }
      })
    }
    
    await supabase
      .from('homepage_cache')
      .upsert({
        cache_key: 'top_rated_bookmarks',
        data: topRatedBookmarks,
        updated_at: new Date().toISOString()
      }, { onConflict: 'cache_key' })
    
    results.top_rated_count = topRatedBookmarks.length
    
    return NextResponse.json({
      success: true,
      message: 'Homepage cache refreshed',
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Homepage cache refresh error:', error)
    return NextResponse.json(
      { error: error.message, results },
      { status: 500 }
    )
  }
}

// Allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
