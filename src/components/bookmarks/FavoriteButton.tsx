'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart, Loader2 } from 'lucide-react'
import { User } from '@supabase/supabase-js'

interface FavoriteButtonProps {
  bookmarkId: string
}

export function FavoriteButton({ bookmarkId }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [supabase] = useState(() => createClient())

  const checkFavoriteStatus = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('bookmark_id', bookmarkId)
      .single()

    setIsFavorited(!!data)
  }, [supabase, bookmarkId])

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('FavoriteButton auth error:', error)
        }
        
        if (!mounted) return
        
        setUser(currentUser)
        
        if (currentUser) {
          await checkFavoriteStatus(currentUser.id)
        }
      } catch (err) {
        console.error('FavoriteButton init error:', err)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await checkFavoriteStatus(session.user.id)
      } else {
        setIsFavorited(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, checkFavoriteStatus])

  const toggleFavorite = async () => {
    if (!user) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }

    setLoading(true)

    try {
      if (isFavorited) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('bookmark_id', bookmarkId)
        
        setIsFavorited(false)
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            bookmark_id: bookmarkId,
          })
        
        setIsFavorited(true)
      }
    } catch (err) {
      console.error('Toggle favorite error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isFavorited
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } disabled:opacity-50`}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
      )}
      {isFavorited ? 'Favorited' : 'Favorite'}
    </button>
  )
}
