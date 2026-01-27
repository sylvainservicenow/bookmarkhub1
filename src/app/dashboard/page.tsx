'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { LogOut, Plus, Bookmark, Heart, User, Search, ExternalLink, Calendar, Mail, Edit, Archive, Shield, Loader2 } from 'lucide-react'

// Avatar mapping - must match settings page
const AVATAR_MAP: Record<string, string> = {
  cat: '🐱', dog: '🐶', fox: '🦊', panda: '🐼', koala: '🐨',
  lion: '🦁', tiger: '🐯', bear: '🐻', rabbit: '🐰', owl: '🦉',
  penguin: '🐧', butterfly: '🦋', dolphin: '🐬', unicorn: '🦄', dragon: '🐉',
  rocket: '🚀', star: '⭐', sun: '🌞', moon: '🌙', rainbow: '🌈',
  flower: '🌸', tree: '🌳', mountain: '🏔️', crystal: '💎', robot: '🤖',
}

interface DashboardData {
  profile: {
    name: string | null
    avatar_url: string | null
    role: string
    created_at: string | null
  } | null
  stats: {
    bookmarkCount: number
    archivedCount: number
    favoriteCount: number
  }
  recentBookmarks: Array<{
    id: string
    title: string
    url: string
    created_at: string
  }>
  recentFavorites: Array<{
    bookmark_id: string
    bookmarks: { id: string; title: string; url: string }
  }>
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  // Single API call that fetches ALL dashboard data at once
  // This reduces 6+ round trips to Supabase down to 1
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch('/api/dashboard/data')
      
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      await signOut({ redirect: false })
      if (typeof window !== 'undefined') {
        sessionStorage.clear()
        document.cookie.split(';').forEach(cookie => {
          const name = cookie.split('=')[0].trim()
          if (name.includes('next-auth') || name.includes('session')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
          }
        })
      }
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      window.location.href = '/'
    }
  }

  if (authLoading || loading || signingOut) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{signingOut ? 'Signing out...' : 'Loading dashboard...'}</span>
        </div>
      </div>
    )
  }

  if (!user || !dashboardData) {
    return null // Middleware will redirect
  }

  const { profile, stats, recentBookmarks, recentFavorites } = dashboardData
  const displayName = profile?.name || user.name || user.email?.split('@')[0]
  const avatarEmoji = profile?.avatar_url ? AVATAR_MAP[profile.avatar_url] : null
  const isAdmin = profile?.role === 'admin' || user.role === 'admin'

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-4xl border-2 border-primary-200">
            {avatarEmoji || <User className="h-8 w-8 text-primary-600" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
              {isAdmin && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  Admin
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </p>
            <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              Member since {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          )}
          <Link
            href="/settings"
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/bookmarks" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <Bookmark className="h-8 w-8 text-primary-500" />
            <span className="text-3xl font-bold text-gray-900">{stats.bookmarkCount}</span>
          </div>
          <p className="text-gray-600 text-sm mt-2">My Bookmarks</p>
        </Link>
        
        <Link href="/favorites" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-red-300 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <Heart className="h-8 w-8 text-red-500" />
            <span className="text-3xl font-bold text-gray-900">{stats.favoriteCount}</span>
          </div>
          <p className="text-gray-600 text-sm mt-2">Favorites</p>
        </Link>
        
        <Link href="/bookmarks" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-amber-300 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <Archive className="h-8 w-8 text-amber-500" />
            <span className="text-3xl font-bold text-gray-900">{stats.archivedCount}</span>
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
          {recentBookmarks.length > 0 ? (
            <ul className="space-y-3">
              {recentBookmarks.map((bookmark) => (
                <li key={bookmark.id} className="group">
                  <Link href={`/bookmark/${bookmark.id}`} className="block">
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
          {recentFavorites.length > 0 ? (
            <ul className="space-y-3">
              {recentFavorites.map((fav) => (
                <li key={fav.bookmark_id} className="group">
                  <Link href={`/bookmark/${fav.bookmark_id}`} className="block">
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
