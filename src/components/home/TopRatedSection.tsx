import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { TopRatedBookmarkCard } from './TopRatedBookmarkCard'

export async function TopRatedSection() {
  const supabase = createAdminClient()
  
  // Try to get cached top rated bookmarks first (refreshed daily)
  const { data: cachedTopRated } = await supabase
    .from('homepage_cache')
    .select('data')
    .eq('cache_key', 'top_rated_bookmarks')
    .single()
  
  let topRated: any[] = []
  
  if (cachedTopRated?.data) {
    // Use cached data
    topRated = cachedTopRated.data
  } else {
    // Fallback: Use the efficient RPC function
    const { data: rpcData } = await supabase
      .rpc('get_top_rated_bookmarks', { limit_count: 3 })
    
    if (rpcData && rpcData.length > 0) {
      // Fetch full bookmark details for the top 3
      const bookmarkIds = rpcData.map((r: any) => r.id)
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
      topRated = rpcData.map((r: any) => {
        const bookmark = bookmarks?.find((b: any) => b.id === r.id)
        return {
          ...bookmark,
          avgRating: parseFloat(r.avg),
          ratingCount: parseInt(r.count)
        }
      })
    }
  }

  if (!topRated || topRated.length === 0) {
    return null
  }

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/browse?sort=rated"
          className="hover:text-primary-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            <h2 className="text-xl font-bold text-gray-900">Top Rated</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">Highest rated by the community</p>
        </Link>
        <Link
          href="/browse?sort=rated"
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View all →
        </Link>
      </div>
      
      {/* Top Rated Cards - Top 3 */}
      <div className="grid md:grid-cols-3 gap-6">
        {topRated.slice(0, 3).map((bookmark: any, index: number) => (
          <TopRatedBookmarkCard 
            key={bookmark.id} 
            bookmark={bookmark}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  )
}
