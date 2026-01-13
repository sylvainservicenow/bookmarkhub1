'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client-with-auth'
import { useSession } from 'next-auth/react'
import { Star, Loader2 } from 'lucide-react'

interface RatingStarsProps {
  bookmarkId: string
  totalRatings: number
  averageRating: number
}

export function RatingStars({ bookmarkId, totalRatings, averageRating }: RatingStarsProps) {
  const { data: session } = useSession()
  const user = session?.user
  const [userRating, setUserRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentAverage, setCurrentAverage] = useState(averageRating)
  const [currentTotal, setCurrentTotal] = useState(totalRatings)
  const [supabase] = useState(() => createClient())
  const mountedRef = useRef(true)

  const fetchUserRating = useCallback(async (userId: string) => {
    if (!mountedRef.current) return
    
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('bookmark_id', bookmarkId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user rating:', error)
      }

      if (mountedRef.current && data) {
        setUserRating(data.rating)
      }
    } catch (err) {
      console.error('Unexpected error fetching rating:', err)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [supabase, bookmarkId])

  useEffect(() => {
    mountedRef.current = true

    if (user?.id) {
      fetchUserRating(user.id)
    } else {
      setLoading(false)
    }

    return () => {
      mountedRef.current = false
    }
  }, [user?.id, fetchUserRating])

  const handleRate = async (rating: number) => {
    if (!user?.id) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }

    setSaving(true)

    try {
      if (userRating) {
        const { error } = await supabase
          .from('ratings')
          .update({ rating })
          .eq('bookmark_id', bookmarkId)
          .eq('user_id', user.id)
        
        if (error) throw error

        const newTotal = (currentAverage * currentTotal - userRating + rating) / currentTotal
        setCurrentAverage(newTotal)
      } else {
        const { error } = await supabase
          .from('ratings')
          .insert({
            bookmark_id: bookmarkId,
            user_id: user.id,
            rating,
          })
        
        if (error) throw error

        const newTotal = currentTotal + 1
        const newAverage = (currentAverage * currentTotal + rating) / newTotal
        setCurrentAverage(newAverage)
        setCurrentTotal(newTotal)
      }

      setUserRating(rating)
    } catch (err) {
      console.error('Rating error:', err)
    } finally {
      setSaving(false)
    }
  }

  const displayRating = hoverRating ?? userRating ?? 0

  return (
    <div className="flex items-center gap-4">
      {/* Interactive stars */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => user && setHoverRating(star)}
            onMouseLeave={() => setHoverRating(null)}
            disabled={loading || saving || !user}
            className={`p-1 transition-all duration-150 ${
              user ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
            } disabled:opacity-50`}
            title={user ? `Rate ${star} star${star > 1 ? 's' : ''}` : 'Sign in to rate'}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= displayRating
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {saving && <Loader2 className="h-4 w-4 animate-spin text-gray-400 ml-2" />}
      </div>

      {/* Rating info */}
      <div className="text-sm text-gray-500">
        <span className="font-medium text-gray-700">{currentAverage.toFixed(1)}</span>
        <span className="mx-1">·</span>
        <span>{currentTotal} rating{currentTotal !== 1 ? 's' : ''}</span>
        {userRating && (
          <span className="ml-2 text-primary-600">(You: {userRating}★)</span>
        )}
      </div>

      {/* Sign in prompt */}
      {!user && !loading && (
        <a 
          href={`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}
          className="text-sm text-primary-600 hover:underline"
        >
          Sign in to rate
        </a>
      )}
    </div>
  )
}
