import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { TopRatedBookmarkCard } from './TopRatedBookmarkCard'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function TopRatedSection() {
  const supabase = getSupabase()
  
  // Fetch all ratings with bookmark info
  const { data: allRatings } = await supabase
    .from('ratings')
    .select(`
      bookmark_id,
      rating,
      bookmarks!inner(
        id,
        title,
        url,
        description,
        favicon_url,
        status,
        visibility,
        creator_id,
        users!bookmarks_creator_id_fkey(name),
        bookmark_tags(tags(id, name))
      )
    `)
    .eq('bookmarks.status', 'active')
    .eq('bookmarks.visibility', 'public')

  // Calculate average ratings per bookmark
  const ratingsByBookmark: Record<string, {
    bookmark: any
    total: number
    count: number
  }> = {}
  
  allRatings?.forEach((r: any) => {
    const bookmarkId = r.bookmark_id
    if (!ratingsByBookmark[bookmarkId]) {
      ratingsByBookmark[bookmarkId] = {
        bookmark: r.bookmarks,
        total: 0,
        count: 0,
      }
    }
    ratingsByBookmark[bookmarkId].total += r.rating
    ratingsByBookmark[bookmarkId].count++
  })
  
  // Sort by average rating and get top 6
  const topRated = Object.values(ratingsByBookmark)
    .map(item => ({
      ...item.bookmark,
      avgRating: item.total / item.count,
      ratingCount: item.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 6)

  if (topRated.length === 0) {
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
      
      {/* Top Rated Cards - 3x2 Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topRated.map((bookmark: any, index: number) => (
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
