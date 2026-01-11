'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart, Loader2 } from 'lucide-react'
import { User } from '@supabase/supabase-js'

interface FavoriteButtonProps {
  bookmarkId: string
  initialFavorited?: boolean
}

export function FavoriteButton({ bookmarkId, initialFavorited }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited ?? false)
  const [loading, setLoading] = useState(!initialFavorited)
  const [user, setUser] = useState<User | null>(null)
  const [supabase] = useState(() => createClient())
  const [isAnimating, setIsAnimating] = useState(false)
  const previousState = useRef(isFavorited)
  const mountedRef = useRef(true)

  const checkFavoriteStatus = useCallback(async (userId: string) => {
    if (!mountedRef.current) return
    
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('bookmark_id', bookmarkId)
        .single()

      if (mountedRef.current) {
        setIsFavorited(!!data)
      }
    } catch (err) {
      // Silently handle - PGRST116 means no favorite found, which is fine
    }
  }, [supabase, bookmarkId])

  useEffect(() => {
    mountedRef.current = true

    const initAuth = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (error && error.name !== 'AuthSessionMissingError') {
          // Silently handle AbortError
          if (!(error instanceof Error && error.name === 'AbortError')) {
            console.error('FavoriteButton auth error:', error)
          }
        }
        
        if (!mountedRef.current) return
        
        setUser(currentUser)
        
        if (currentUser) {
          await checkFavoriteStatus(currentUser.id)
        }
      } catch (err) {
        // Silently handle AbortError
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        console.error('FavoriteButton init error:', err)
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }
    
    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mountedRef.current) return
      
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await checkFavoriteStatus(session.user.id)
      } else {
        setIsFavorited(false)
      }
    })

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [supabase, checkFavoriteStatus])

  const toggleFavorite = async () => {
    if (!user) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }

    // Store previous state for rollback
    previousState.current = isFavorited
    
    // OPTIMISTIC UPDATE - Update UI immediately
    const newState = !isFavorited
    setIsFavorited(newState)
    
    // Trigger animation when favoriting
    if (newState) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }

    try {
      if (previousState.current) {
        // Was favorited, now removing
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('bookmark_id', bookmarkId)
        
        if (error) throw error
      } else {
        // Was not favorited, now adding
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            bookmark_id: bookmarkId,
          })
        
        if (error) throw error
      }
    } catch (err) {
      // ROLLBACK on error
      console.error('Toggle favorite error:', err)
      setIsFavorited(previousState.current)
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
        isFavorited
          ? 'bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart 
          className={`h-4 w-4 transition-all duration-150 ${
            isFavorited ? 'fill-current' : ''
          } ${isAnimating ? 'heart-pop' : ''}`} 
        />
      )}
      {isFavorited ? 'Favorited' : 'Favorite'}
    </button>
  )
}
