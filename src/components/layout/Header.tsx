'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { BookmarkIcon, User as UserIcon } from 'lucide-react'

// Avatar mapping - must match settings page
const AVATAR_MAP: Record<string, string> = {
  cat: '🐱', dog: '🐶', fox: '🦊', panda: '🐼', koala: '🐨',
  lion: '🦁', tiger: '🐯', bear: '🐻', rabbit: '🐰', owl: '🦉',
  penguin: '🐧', butterfly: '🦋', dolphin: '🐬', unicorn: '🦄', dragon: '🐉',
  rocket: '🚀', star: '⭐', sun: '🌞', moon: '🌙', rainbow: '🌈',
  flower: '🌸', tree: '🌳', mountain: '🏔️', crystal: '💎', robot: '🤖',
}

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{ name: string | null; avatar_url: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('name, avatar_url')
      .eq('id', userId)
      .single()
    return data
  }, [supabase])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const displayName = profile?.name || user?.email?.split('@')[0] || ''
  const avatarEmoji = profile?.avatar_url ? AVATAR_MAP[profile.avatar_url] : null

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <BookmarkIcon className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">Bookmark Hub</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-lg">
                  {avatarEmoji || <UserIcon className="h-5 w-5 text-primary-600" />}
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {displayName}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg"
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
