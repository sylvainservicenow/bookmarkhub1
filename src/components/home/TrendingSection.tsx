import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { TrendingUp, Flame } from 'lucide-react'
import { TrendingBookmarkCard } from './TrendingBookmarkCard'
import { unstable_cache } from 'next/cache'

// Cache trending bookmarks for 5 minutes (combines with ISR)
const getCachedTrendingBookmarks = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    
    // First try the homepage_cache table (updated by cron)
    const { data: cachedTrending } = await supabase
      .from('homepage_cache')
      .select('data')
      .eq('cache_key', 'trending_bookmarks')
      .single()
    
    if (cachedTrending?.data) {
      return cachedTrending.data
    }
    
    // Fallback: direct query with minimal fields
    const { data } = await supabase
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
    
    return data
  },
  ['trending-bookmarks'],
  { revalidate: 300, tags: ['trending'] } // 5 minute cache
)

export async function TrendingSection() {
  const bookmarks = await getCachedTrendingBookmarks()

  if (!bookmarks || bookmarks.length === 0) {
    return null
  }

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/browse?sort=popular"
          className="flex items-center gap-2 hover:text-primary-600 transition-colors"
        >
          <TrendingUp className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Trending Today</h2>
        </Link>
        <Link
          href="/browse?sort=popular"
          className="flex items-center gap-1 px-3 py-1 bg-orange-50 rounded-full hover:bg-orange-100 transition-colors"
        >
          <span className="text-sm font-medium text-primary-600">Hot</span>
          <Flame className="h-4 w-4 text-primary-500" />
        </Link>
      </div>
      
      {/* Trending Cards - Top 3 */}
      <div className="grid md:grid-cols-3 gap-6">
        {bookmarks.slice(0, 3).map((bookmark: any, index: number) => (
          <TrendingBookmarkCard 
            key={bookmark.id} 
            bookmark={bookmark} 
            rank={index + 1} 
          />
        ))}
      </div>
    </div>
  )
}
