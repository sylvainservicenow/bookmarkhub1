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
  // Use server-provided values directly - they are the source of truth
  const [currentAverage, setCurrentAverage] = useState(averageRating)
  const [currentTotal, setCurrentTotal] = useState(totalRatings)
  const [supabase] = useState(() => createClient())
  const mountedRef = useRef(true)

  // Fetch fresh ratings data from server
  const fetchRatingsData = useCallback(async () => {
    if (!mountedRef.current) return
    
    try {
      // Fetch all ratings for this bookmark to get accurate count and average
      const { data: allRatings, error } = await supabase
        .from('ratings')
        .select('rating, user_id')
        .eq('bookmark_id', bookmarkId)

      if (error) {
        console.error('Error fetching ratings:', error)
        return
      }

      if (mountedRef.current && allRatings) {
        // Calculate accurate totals
        const total = allRatings.length
        const avg = total > 0 
          ? allRatings.reduce((sum, r) => sum + r.rating, 0) / total 
          : 0
        
        setCurrentTotal(total)
        setCurrentAverage(avg)
        
        // Find user's rating if logged in
        if (user?.id) {
          const userRatingData = allRatings.find(r => r.user_id === user.id)
          if (userRatingData) {
            setUserRating(userRatingData.rating)
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching ratings:', err)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [supabase, bookmarkId, user?.id])

  useEffect(() => {
    mountedRef.current = true
    fetchRatingsData()

    return () => {
      mountedRef.current = false
    }
  }, [fetchRatingsData])

  const handleRate = async (rating: number) => {
    if (!user?.id) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }

    setSaving(true)
    const previousRating = userRating
    const previousTotal = currentTotal
    const previousAverage = currentAverage

    // Optimistic update
    if (previousRating) {
      // Updating existing rating
      const newAvg = (previousAverage * previousTotal - previousRating + rating) / previousTotal
      setCurrentAverage(newAvg)
    } else {
      // New rating
      const newTotal = previousTotal + 1
      const newAvg = (previousAverage * previousTotal + rating) / newTotal
      setCurrentTotal(newTotal)
      setCurrentAverage(newAvg)
    }
    setUserRating(rating)

    try {
      if (previousRating) {
        const { error } = await supabase
          .from('ratings')
          .update({ rating })
          .eq('bookmark_id', bookmarkId)
          .eq('user_id', user.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('ratings')
          .insert({
            bookmark_id: bookmarkId,
            user_id: user.id,
            rating,
          })
        
        if (error) throw error
      }
    } catch (err) {
      console.error('Rating error:', err)
      // Rollback on error
      setUserRating(previousRating)
      setCurrentTotal(previousTotal)
      setCurrentAverage(previousAverage)
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
