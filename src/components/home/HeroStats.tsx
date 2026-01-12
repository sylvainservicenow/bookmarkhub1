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

  // Count unique contributors (users who have created at least one bookmark)
  const { data: contributors } = await supabase
    .from('bookmarks')
    .select('creator_id')
    .eq('status', 'active')
    .not('creator_id', 'is', null)
  
  const uniqueContributors = contributors ? new Set(contributors.map(b => b.creator_id)).size : 0

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
          {uniqueContributors}+
        </div>
        <div className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Contributors</div>
      </Link>
    </div>
  )
}
