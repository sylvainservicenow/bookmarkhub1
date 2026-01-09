import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LogOut, Plus, Bookmark, Heart, Settings, User, Search, ExternalLink, Calendar, Mail, Edit, Archive } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch user's active bookmarks count
  const { count: bookmarkCount } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', user.id)
    .eq('status', 'active')

  // Fetch user's archived bookmarks count
  const { count: archivedCount } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', user.id)
    .eq('status', 'archived')

  // Fetch user's favorites count
  const { count: favoriteCount } = await supabase
    .from('favorites')
    .select('*, bookmarks!inner(*)', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('bookmarks.status', 'active')

  // Fetch recent bookmarks
  const { data: recentBookmarks } = await supabase
    .from('bookmarks')
    .select('id, title, url, created_at')
    .eq('creator_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch recent favorites
  const { data: recentFavorites } = await supabase
    .from('favorites')
    .select('bookmark_id, bookmarks!inner(id, title, url)')
    .eq('user_id', user.id)
    .eq('bookmarks.status', 'active')
    .order('created_at', { ascending: false })
    .limit(5)

  const displayName = profile?.name || user.email?.split('@')[0]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </p>
            <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              Member since {new Date(profile?.created_at || user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/bookmarks" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <Bookmark className="h-8 w-8 text-primary-500" />
            <span className="text-3xl font-bold text-gray-900">{bookmarkCount || 0}</span>
          </div>
          <p className="text-gray-600 text-sm mt-2">My Bookmarks</p>
        </Link>
        
        <Link href="/favorites" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-red-300 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <Heart className="h-8 w-8 text-red-500" />
            <span className="text-3xl font-bold text-gray-900">{favoriteCount || 0}</span>
          </div>
          <p className="text-gray-600 text-sm mt-2">Favorites</p>
        </Link>
        
        <Link href="/bookmarks" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-amber-300 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <Archive className="h-8 w-8 text-amber-500" />
            <span className="text-3xl font-bold text-gray-900">{archivedCount || 0}</span>
          </div>
          <p className="text-gray-600 text-sm mt-2">Archived</p>
        </Link>
        
        <Link href="/submit" className="bg-primary-600 text-white rounded-lg p-4 hover:bg-primary-700 transition-colors">
          <div className="flex items-center justify-between">
            <Plus className="h-8 w-8" />
          </div>
          <p className="text-sm mt-2 font-medium">Submit New Bookmark</p>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/search"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Search className="h-4 w-4" />
          Search Bookmarks
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Browse All
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Bookmarks */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-primary-500" />
              Recent Bookmarks
            </h2>
            <Link href="/bookmarks" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          {recentBookmarks && recentBookmarks.length > 0 ? (
            <ul className="space-y-3">
              {recentBookmarks.map((bookmark: any) => (
                <li key={bookmark.id} className="group">
                  <Link
                    href={`/bookmark/${bookmark.id}`}
                    className="block"
                  >
                    <p className="text-gray-900 group-hover:text-primary-600 line-clamp-1 font-medium">
                      {bookmark.title}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {new Date(bookmark.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6">
              <Bookmark className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No bookmarks yet</p>
              <Link href="/submit" className="text-primary-600 text-sm hover:underline">
                Submit your first bookmark
              </Link>
            </div>
          )}
        </div>

        {/* Recent Favorites */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Recent Favorites
            </h2>
            <Link href="/favorites" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          {recentFavorites && recentFavorites.length > 0 ? (
            <ul className="space-y-3">
              {recentFavorites.map((fav: any) => (
                <li key={fav.bookmark_id} className="group">
                  <Link
                    href={`/bookmark/${fav.bookmark_id}`}
                    className="block"
                  >
                    <p className="text-gray-900 group-hover:text-primary-600 line-clamp-1 font-medium">
                      {fav.bookmarks?.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6">
              <Heart className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No favorites yet</p>
              <Link href="/search" className="text-primary-600 text-sm hover:underline">
                Discover bookmarks to favorite
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
