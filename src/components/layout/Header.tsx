'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { BookmarkIcon, User as UserIcon, Plus, Loader2, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client-with-auth'

// Avatar mapping - must match settings page
const AVATAR_MAP: Record<string, string> = {
  cat: '🐱', dog: '🐶', fox: '🦊', panda: '🐼', koala: '🐨',
  lion: '🦁', tiger: '🐯', bear: '🐻', rabbit: '🐰', owl: '🦉',
  penguin: '🐧', butterfly: '🦋', dolphin: '🐬', unicorn: '🦄', dragon: '🐉',
  rocket: '🚀', star: '⭐', sun: '🌞', moon: '🌙', rainbow: '🌈',
  flower: '🌸', tree: '🌳', mountain: '🏔️', crystal: '💎', robot: '🤖',
}

export function Header() {
  const { data: session, status } = useSession()
  const [showDropdown, setShowDropdown] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const loading = status === 'loading'
  const user = session?.user

  // Fetch avatar from profile
  useEffect(() => {
    if (user?.id) {
      const fetchAvatar = async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url)
        }
      }
      fetchAvatar()
    }
  }, [user?.id])

  const displayName = user?.name || user?.email?.split('@')[0] || ''
  const avatarEmoji = avatarUrl ? AVATAR_MAP[avatarUrl] : null

  const handleSignOut = async () => {
    setShowDropdown(false)
    setSigningOut(true)
    
    // Clear all cookies manually first
    if (typeof document !== 'undefined') {
      const cookiesToClear = [
        'next-auth.session-token',
        'next-auth.csrf-token', 
        'next-auth.callback-url',
        '__Secure-next-auth.session-token',
        '__Secure-next-auth.csrf-token',
        '__Secure-next-auth.callback-url',
      ]
      
      cookiesToClear.forEach(name => {
        // Clear with various path/domain combinations
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`
      })
      
      // Clear sessionStorage too
      sessionStorage.clear()
    }
    
    try {
      // Call NextAuth signOut
      await signOut({ redirect: false })
    } catch (error) {
      console.error('Sign out error:', error)
    }
    
    // Force hard navigation regardless of signOut result
    window.location.href = '/login'
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookmarkIcon className="h-7 w-7 text-primary-500" />
            <span className="text-xl font-bold text-gray-900">BookmarkHub</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {loading || signingOut ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm hidden sm:inline">{signingOut ? 'Signing out...' : 'Loading...'}</span>
              </div>
            ) : user ? (
              <>
                {/* Add Bookmark Button */}
                <Link
                  href="/submit"
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 active:bg-primary-700 transition-colors text-sm font-medium shadow-sm hover:shadow"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Bookmark</span>
                </Link>
                
                {/* User Menu with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-lg transition-transform hover:scale-105">
                      {avatarEmoji || <UserIcon className="h-5 w-5 text-primary-600" />}
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      {displayName}
                    </span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowDropdown(false)} 
                      />
                      
                      {/* Menu */}
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 animate-fade-in">
                        <Link
                          href="/dashboard"
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/bookmarks"
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          My Bookmarks
                        </Link>
                        <Link
                          href="/favorites"
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          My Favorites
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Settings
                        </Link>
                        <hr className="my-1 border-gray-200" />
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 active:bg-primary-700 px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
