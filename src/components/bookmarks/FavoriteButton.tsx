'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client-with-auth'
import { useSession } from 'next-auth/react'
import { Heart, Loader2 } from 'lucide-react'

interface FavoriteButtonProps {
  bookmarkId: string
  initialFavorited?: boolean
}

export function FavoriteButton({ bookmarkId, initialFavorited }: FavoriteButtonProps) {
  const { data: session } = useSession()
  const user = session?.user
  const [isFavorited, setIsFavorited] = useState(initialFavorited ?? false)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())
  const [isAnimating, setIsAnimating] = useState(false)
  const previousState = useRef(isFavorited)
  const mountedRef = useRef(true)

  const checkFavoriteStatus = useCallback(async (userId: string) => {
    if (!mountedRef.current) return
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('bookmark_id', bookmarkId)
        .maybeSingle()

      if (error) {
        console.error('Error checking favorite status:', error)
      }

      if (mountedRef.current) {
        setIsFavorited(!!data)
      }
    } catch (err) {
      console.error('Unexpected error checking favorite:', err)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [supabase, bookmarkId])

  useEffect(() => {
    mountedRef.current = true

    if (user?.id) {
      checkFavoriteStatus(user.id)
    } else {
      setLoading(false)
    }

    return () => {
      mountedRef.current = false
    }
  }, [user?.id, checkFavoriteStatus])

  const toggleFavorite = async () => {
    if (!user?.id) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }

    previousState.current = isFavorited
    const newState = !isFavorited
    setIsFavorited(newState)
    
    if (newState) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }

    try {
      if (previousState.current) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('bookmark_id', bookmarkId)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            bookmark_id: bookmarkId,
          })
        
        if (error) throw error
      }
    } catch (err) {
      console.error('Toggle favorite error:', err)
      setIsFavorited(previousState.current)
    }
  }

  if (!user) {
    return null
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
