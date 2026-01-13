import { createClient } from '@supabase/supabase-js'
import { Bookmark, Users, TrendingUp } from 'lucide-react'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function HeroStats() {
  const supabase = getSupabase()
  
  // Fetch counts - don't filter by visibility for total count
  const [bookmarksResult, usersResult] = await Promise.all([
    supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  const bookmarkCount = bookmarksResult.count || 0
  const userCount = usersResult.count || 0

  return (
    <div className="flex items-center justify-center gap-8 mt-8">
      <div className="flex items-center gap-2 text-gray-600">
        <Bookmark className="h-5 w-5 text-primary-500" />
        <span className="font-semibold text-gray-900">{bookmarkCount.toLocaleString()}</span>
        <span>bookmarks</span>
      </div>
      <div className="flex items-center gap-2 text-gray-600">
        <Users className="h-5 w-5 text-primary-500" />
        <span className="font-semibold text-gray-900">{userCount.toLocaleString()}</span>
        <span>members</span>
      </div>
      <div className="flex items-center gap-2 text-gray-600">
        <TrendingUp className="h-5 w-5 text-green-500" />
        <span className="font-semibold text-gray-900">Growing</span>
        <span>daily</span>
      </div>
    </div>
  )
}
