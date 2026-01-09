'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'

interface FavoriteButtonProps {
  bookmarkId: string
}

export function FavoriteButton({ bookmarkId }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const checkFavorite = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }
      
      setUserId(user.id)

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('bookmark_id', bookmarkId)
        .single()

      setIsFavorited(!!data)
      setLoading(false)
    }

    checkFavorite()
  }, [bookmarkId, supabase])

  const toggleFavorite = async () => {
    if (!userId) {
      // Redirect to login or show message
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }

    setLoading(true)

    if (isFavorited) {
      // Remove favorite
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('bookmark_id', bookmarkId)
      
      setIsFavorited(false)
    } else {
      // Add favorite
      await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          bookmark_id: bookmarkId,
        })
      
      setIsFavorited(true)
    }

    setLoading(false)
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
      <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
      {isFavorited ? 'Favorited' : 'Favorite'}
    </button>
  )
}
