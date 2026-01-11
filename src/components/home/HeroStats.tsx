import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export async function HeroStats() {
  const supabase = await createClient()
  
  // Fetch counts
  const { count: totalBookmarks } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('visibility', 'public')

  const { count: totalTags } = await supabase
    .from('tags')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Count unique tags used in bookmarks (categories)
  const { count: totalCategories } = await supabase
    .from('bookmark_tags')
    .select('tag_id', { count: 'exact', head: true })

  const formatCount = (count: number | null) => {
    if (!count) return '0'
    if (count >= 10000) return `${Math.floor(count / 1000)}K+`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`
    return `${count}+`
  }

  return (
    <div className="flex items-center justify-center gap-8 md:gap-16">
      <Link href="/browse" className="text-center group">
        <div className="text-2xl md:text-3xl font-bold text-primary-500 group-hover:text-primary-600 transition-colors">
          {formatCount(totalBookmarks)}
        </div>
        <div className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Bookmarks</div>
      </Link>
      
      <div className="h-8 w-px bg-gray-300" />
      
      <Link href="/browse" className="text-center group">
        <div className="text-2xl md:text-3xl font-bold text-primary-500 group-hover:text-primary-600 transition-colors">
          {formatCount(totalTags)}
        </div>
        <div className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Tags</div>
      </Link>
      
      <div className="h-8 w-px bg-gray-300" />
      
      <Link href="/browse" className="text-center group">
        <div className="text-2xl md:text-3xl font-bold text-primary-500 group-hover:text-primary-600 transition-colors">
          {formatCount(totalCategories)}
        </div>
        <div className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Categories</div>
      </Link>
    </div>
  )
}
