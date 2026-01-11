import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TrendingUp, Flame } from 'lucide-react'
import { TrendingBookmarkCard } from './TrendingBookmarkCard'

export async function TrendingSection() {
  const supabase = await createClient()
  
  // Fetch trending bookmarks (most clicks + recent)
  const { data: bookmarks } = await supabase
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

  if (!bookmarks || bookmarks.length === 0) {
    return null
  }

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Trending Today</h2>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 rounded-full">
          <span className="text-sm font-medium text-primary-600">Hot</span>
          <Flame className="h-4 w-4 text-primary-500" />
        </div>
      </div>
      
      {/* Trending Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {bookmarks.map((bookmark: any, index: number) => (
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
