import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Bookmark, FolderOpen, Tag, TrendingUp, Clock, Star } from 'lucide-react'

// Cache this component for 60 seconds - homepage stats don't need real-time updates
export const revalidate = 60

export async function TopStats() {
  const supabase = createAdminClient()
  
  // Fetch top bookmarks (by click count) - only needed columns
  const { data: topBookmarks } = await supabase
    .from('bookmarks')
    .select('id, title, click_count')
    .eq('status', 'active')
    .eq('visibility', 'public')
    .order('click_count', { ascending: false })
    .limit(5)

  // Fetch recent bookmarks - only needed columns
  const { data: recentBookmarks } = await supabase
    .from('bookmarks')
    .select('id, title, created_at')
    .eq('status', 'active')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch best rated bookmarks using efficient aggregation
  // This query gets pre-aggregated ratings instead of fetching ALL ratings
  const { data: bestRatedData } = await supabase
    .rpc('get_top_rated_bookmarks', { limit_count: 5 })
    .select('*')
  
  // Fallback if RPC doesn't exist yet - use a more efficient query
  let bestRated: { id: string; title: string; avg: number; count: number }[] = []
  
  if (bestRatedData && bestRatedData.length > 0) {
    bestRated = bestRatedData
  } else {
    // Fallback: fetch only bookmarks that HAVE ratings, with limit
    // This is still more efficient than fetching ALL ratings
    const { data: ratedBookmarks } = await supabase
      .from('bookmarks')
      .select(`
        id,
        title,
        ratings(rating)
      `)
      .eq('status', 'active')
      .eq('visibility', 'public')
      .not('ratings', 'is', null)
      .limit(50)  // Reasonable limit instead of ALL
    
    if (ratedBookmarks) {
      bestRated = ratedBookmarks
        .filter((b: any) => b.ratings && b.ratings.length > 0)
        .map((b: any) => ({
          id: b.id,
          title: b.title,
          avg: b.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / b.ratings.length,
          count: b.ratings.length
        }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5)
    }
  }

  // Fetch total counts - head: true means no data transfer, just count
  const { count: totalBookmarks } = await supabase
    .from('bookmarks')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('visibility', 'public')

  const { count: totalGroups } = await supabase
    .from('groups')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: totalTags } = await supabase
    .from('tags')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  return (
    <div className="max-w-6xl mx-auto">
      {/* Overall Stats - Clickable */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Link 
          href="/groups"
          className="bg-white rounded-lg p-4 text-center border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all"
        >
          <FolderOpen className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{totalGroups || 0}</div>
          <div className="text-sm text-gray-500">Groups</div>
        </Link>
        <Link 
          href="/tags"
          className="bg-white rounded-lg p-4 text-center border border-gray-200 hover:border-amber-300 hover:shadow-sm transition-all"
        >
          <Tag className="h-6 w-6 text-amber-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{totalTags || 0}</div>
          <div className="text-sm text-gray-500">Tags</div>
        </Link>
        <Link 
          href="/search"
          className="bg-white rounded-lg p-4 text-center border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <Bookmark className="h-6 w-6 text-primary-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{totalBookmarks || 0}</div>
          <div className="text-sm text-gray-500">Bookmarks</div>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Popular Bookmarks */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <Link href="/search?sort=popular" className="flex items-center gap-2 mb-4 hover:text-primary-600 transition-colors">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Popular</h2>
          </Link>
          <ul className="space-y-3">
            {topBookmarks && topBookmarks.length > 0 ? (
              topBookmarks.map((bookmark: any) => (
                <li key={bookmark.id}>
                  <Link
                    href={`/bookmark/${bookmark.id}`}
                    className="text-gray-600 hover:text-primary-600 line-clamp-1 block text-sm"
                  >
                    {bookmark.title}
                  </Link>
                  {bookmark.click_count > 0 && (
                    <span className="text-xs text-gray-400">{bookmark.click_count} clicks</span>
                  )}
                </li>
              ))
            ) : (
              <li className="text-gray-400 text-sm">No bookmarks yet</li>
            )}
          </ul>
        </div>

        {/* Recent Bookmarks */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <Link href="/search?sort=recent" className="flex items-center gap-2 mb-4 hover:text-primary-600 transition-colors">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Recent</h2>
          </Link>
          <ul className="space-y-3">
            {recentBookmarks && recentBookmarks.length > 0 ? (
              recentBookmarks.map((bookmark: any) => (
                <li key={bookmark.id}>
                  <Link
                    href={`/bookmark/${bookmark.id}`}
                    className="text-gray-600 hover:text-primary-600 line-clamp-1 block text-sm"
                  >
                    {bookmark.title}
                  </Link>
                  <span className="text-xs text-gray-400">
                    {new Date(bookmark.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-gray-400 text-sm">No bookmarks yet</li>
            )}
          </ul>
        </div>

        {/* Best Rated */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <Link href="/search?sort=rated" className="flex items-center gap-2 mb-4 hover:text-primary-600 transition-colors">
            <Star className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Best Rated</h2>
          </Link>
          <ul className="space-y-3">
            {bestRated.length > 0 ? (
              bestRated.map((bookmark) => (
                <li key={bookmark.id}>
                  <Link
                    href={`/bookmark/${bookmark.id}`}
                    className="text-gray-600 hover:text-primary-600 line-clamp-1 block text-sm"
                  >
                    {bookmark.title}
                  </Link>
                  <span className="text-xs text-amber-500 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-500" />
                    {bookmark.avg.toFixed(1)} ({bookmark.count} {bookmark.count === 1 ? 'rating' : 'ratings'})
                  </span>
                </li>
              ))
            ) : (
              <li className="text-gray-400 text-sm">No ratings yet</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
