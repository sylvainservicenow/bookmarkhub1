import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Bookmark, Globe, Tag, TrendingUp, Users, Star } from 'lucide-react'

export async function TopStats() {
  const supabase = await createClient()
  
  // Fetch top bookmarks (by click count or favorites)
  const { data: topBookmarks } = await supabase
    .from('bookmarks')
    .select('id, title, click_count')
    .eq('status', 'active')
    .eq('visibility', 'public')
    .order('click_count', { ascending: false })
    .limit(5)

  // Fetch recent bookmarks
  const { data: recentBookmarks } = await supabase
    .from('bookmarks')
    .select('id, title, created_at')
    .eq('status', 'active')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch top tags (by usage count)
  const { data: topTags } = await supabase
    .from('bookmark_tags')
    .select('tag_id, tags!inner(id, name, status)')
    .eq('tags.status', 'active')

  // Count tag usage
  const tagCounts: Record<string, { id: string; name: string; count: number }> = {}
  topTags?.forEach((bt: any) => {
    const tag = bt.tags
    if (tag) {
      if (!tagCounts[tag.id]) {
        tagCounts[tag.id] = { id: tag.id, name: tag.name, count: 0 }
      }
      tagCounts[tag.id].count++
    }
  })
  const sortedTags = Object.values(tagCounts).sort((a, b) => b.count - a.count).slice(0, 5)

  // Fetch total counts
  const { count: totalBookmarks } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('visibility', 'public')

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: totalTags } = await supabase
    .from('tags')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  return (
    <div className="max-w-6xl mx-auto">
      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
          <Bookmark className="h-6 w-6 text-primary-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{totalBookmarks || 0}</div>
          <div className="text-sm text-gray-500">Bookmarks</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
          <Users className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{totalUsers || 0}</div>
          <div className="text-sm text-gray-500">Users</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
          <Tag className="h-6 w-6 text-amber-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{totalTags || 0}</div>
          <div className="text-sm text-gray-500">Tags</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Popular Bookmarks */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Popular</h2>
          </div>
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
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Recent</h2>
          </div>
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

        {/* Top Tags */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Top Tags</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {sortedTags.length > 0 ? (
              sortedTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/search?tag=${encodeURIComponent(tag.name)}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-primary-100 hover:text-primary-700 transition-colors"
                >
                  {tag.name}
                  <span className="text-xs text-gray-400">({tag.count})</span>
                </Link>
              ))
            ) : (
              <span className="text-gray-400 text-sm">No tags yet</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
