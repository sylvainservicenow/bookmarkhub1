import { createClient } from '@/lib/supabase/server'

export async function HeroStats() {
  const supabase = await createClient()
  
  // Fetch counts
  const { count: totalBookmarks } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('visibility', 'public')

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: totalTags } = await supabase
    .from('tags')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const formatCount = (count: number | null) => {
    if (!count) return '0'
    if (count >= 10000) return `${Math.floor(count / 1000)}K+`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`
    return `${count}+`
  }

  return (
    <div className="flex items-center justify-center gap-8 md:gap-16">
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-primary-500">
          {formatCount(totalBookmarks)}
        </div>
        <div className="text-sm text-gray-500">Bookmarks</div>
      </div>
      
      <div className="h-8 w-px bg-gray-300" />
      
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-primary-500">
          {formatCount(totalUsers)}
        </div>
        <div className="text-sm text-gray-500">Contributors</div>
      </div>
      
      <div className="h-8 w-px bg-gray-300" />
      
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-primary-500">
          {formatCount(totalTags)}
        </div>
        <div className="text-sm text-gray-500">Categories</div>
      </div>
    </div>
  )
}
