import { createAdminClient } from '@/lib/supabase/admin'
import { Bookmark, TrendingUp } from 'lucide-react'

// Helper to round to nearest nice number (400+, 1000+, etc)
function formatApproxCount(count: number): string {
  if (count < 10) return count.toString()
  if (count < 100) {
    const rounded = Math.floor(count / 10) * 10
    return `${rounded}+`
  }
  if (count < 1000) {
    const rounded = Math.floor(count / 100) * 100
    return `${rounded}+`
  }
  const rounded = Math.floor(count / 1000)
  return `${rounded}k+`
}

export async function HeroStats() {
  const supabase = createAdminClient()
  
  // Try to get cached stats first (refreshed daily by cron)
  const { data: cachedStats } = await supabase
    .from('homepage_stats')
    .select('stat_key, stat_value')
    .in('stat_key', ['bookmark_count'])
  
  let bookmarkCount = 0
  
  if (cachedStats && cachedStats.length > 0) {
    // Use cached values
    cachedStats.forEach(stat => {
      if (stat.stat_key === 'bookmark_count') bookmarkCount = stat.stat_value || 0
    })
  } else {
    // Fallback: direct count (only if cache doesn't exist)
    const { count } = await supabase
      .from('bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
    bookmarkCount = count || 0
  }

  return (
    <div className="flex items-center justify-center gap-8 mt-8">
      <div className="flex items-center gap-2 text-gray-600">
        <Bookmark className="h-5 w-5 text-primary-500" />
        <span className="font-semibold text-gray-900">{formatApproxCount(bookmarkCount)}</span>
        <span>bookmarks</span>
      </div>
      <div className="flex items-center gap-2 text-gray-600">
        <TrendingUp className="h-5 w-5 text-green-500" />
        <span className="font-semibold text-gray-900">Growing</span>
        <span>daily</span>
      </div>
    </div>
  )
}
