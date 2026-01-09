import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LogOut, Plus, Bookmark, Star, Settings } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch user's active bookmarks
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('creator_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch user's favorites (only active bookmarks)
  const { data: favorites } = await supabase
    .from('favorites')
    .select('bookmark_id, bookmarks!inner(*)')
    .eq('user_id', user.id)
    .eq('bookmarks.status', 'active')
    .limit(5)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.user_metadata?.display_name || user.email?.split('@')[0]}</p>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </form>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/submit"
              className="flex items-center gap-2 p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Submit Bookmark
            </Link>
            <Link
              href="/bookmarks"
              className="flex items-center gap-2 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bookmark className="h-5 w-5" />
              My Bookmarks
            </Link>
            <Link
              href="/favorites"
              className="flex items-center gap-2 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Star className="h-5 w-5" />
              Favorites
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </div>
        </div>

        {/* Recent Bookmarks */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Recent Bookmarks</h2>
          {bookmarks && bookmarks.length > 0 ? (
            <ul className="space-y-2">
              {bookmarks.map((bookmark: any) => (
                <li key={bookmark.id}>
                  <Link
                    href={`/bookmark/${bookmark.id}`}
                    className="text-gray-600 hover:text-primary-600 line-clamp-1"
                  >
                    {bookmark.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No bookmarks yet</p>
          )}
        </div>

        {/* Favorites */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Favorites</h2>
          {favorites && favorites.length > 0 ? (
            <ul className="grid md:grid-cols-2 gap-2">
              {favorites.map((fav: any) => (
                <li key={fav.bookmark_id}>
                  <Link
                    href={`/bookmark/${fav.bookmark_id}`}
                    className="text-gray-600 hover:text-primary-600 line-clamp-1"
                  >
                    {fav.bookmarks?.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No favorites yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
