import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/dashboard/data
 * 
 * Batched endpoint that returns ALL dashboard data in a single request.
 * This reduces 6+ round trips to Supabase down to 1, dramatically cutting:
 * - Function invocations (your biggest cost driver)
 * - Fast Origin Transfer (data from Supabase)
 * - Function compute time
 * 
 * The response is also cacheable on the edge for 30 seconds.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const userId = session.user.id
  const supabase = createAdminClient()
  
  // Run all queries in parallel using Promise.all
  // This is the key optimization - parallel execution + single HTTP response
  const [
    profileResult,
    bookmarkCountResult,
    archivedCountResult,
    favoriteCountResult,
    recentBookmarksResult,
    recentFavoritesResult
  ] = await Promise.all([
    // 1. Profile data
    supabase
      .from('users')
      .select('name, avatar_url, role, created_at')
      .eq('id', userId)
      .single(),
    
    // 2. Active bookmarks count
    supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId)
      .eq('status', 'active'),
    
    // 3. Archived bookmarks count
    supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId)
      .eq('status', 'archived'),
    
    // 4. Favorites count
    supabase
      .from('favorites')
      .select('*, bookmarks!inner(*)', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('bookmarks.status', 'active'),
    
    // 5. Recent bookmarks (only needed fields)
    supabase
      .from('bookmarks')
      .select('id, title, url, created_at')
      .eq('creator_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5),
    
    // 6. Recent favorites
    supabase
      .from('favorites')
      .select('bookmark_id, bookmarks!inner(id, title, url)')
      .eq('user_id', userId)
      .eq('bookmarks.status', 'active')
      .order('created_at', { ascending: false })
      .limit(5)
  ])
  
  const dashboardData = {
    profile: profileResult.data,
    stats: {
      bookmarkCount: bookmarkCountResult.count || 0,
      archivedCount: archivedCountResult.count || 0,
      favoriteCount: favoriteCountResult.count || 0,
    },
    recentBookmarks: recentBookmarksResult.data || [],
    recentFavorites: recentFavoritesResult.data || [],
  }
  
  // Return with cache headers - edge cache for 30 seconds
  return NextResponse.json(dashboardData, {
    headers: {
      'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
    },
  })
}
