'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Star } from 'lucide-react'

interface RatingStarsProps {
  bookmarkId: string
  initialRating?: number
  totalRatings?: number
  averageRating?: number
}

export function RatingStars({ bookmarkId, initialRating, totalRatings = 0, averageRating }: RatingStarsProps) {
  const [userRating, setUserRating] = useState<number | null>(initialRating ?? null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session?.user)
      
      if (session?.user) {
        // Fetch user's existing rating
        const { data } = await supabase
          .from('ratings')
          .select('rating')
          .eq('bookmark_id', bookmarkId)
          .eq('user_id', session.user.id)
          .single()
        
        if (data) {
          setUserRating(data.rating)
        }
      }
    }
    checkUser()
  }, [supabase, bookmarkId])

  const handleRate = async (rating: number) => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/bookmark/${bookmarkId}`)
      return
    }

    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setLoading(false)
      return
    }

    // Check if user already rated
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('bookmark_id', bookmarkId)
      .eq('user_id', user.id)
      .single()

    if (existingRating) {
      // Update existing rating
      await supabase
        .from('ratings')
        .update({ rating, updated_at: new Date().toISOString() })
        .eq('id', existingRating.id)
    } else {
      // Create new rating
      await supabase
        .from('ratings')
        .insert({
          bookmark_id: bookmarkId,
          user_id: user.id,
          rating,
        })
    }

    setUserRating(rating)
    setLoading(false)
    router.refresh()
  }

  const displayRating = hoveredRating ?? userRating ?? 0

  return (
    <div className="flex flex-col gap-2">
      {/* Interactive stars */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(null)}
            disabled={loading}
            className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
            title={`Rate ${star} star${star !== 1 ? 's' : ''}`}
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
        
        {loading && (
          <span className="ml-2 text-sm text-gray-400">Saving...</span>
        )}
      </div>

      {/* Rating info */}
      <div className="text-sm text-gray-500">
        {averageRating !== undefined && averageRating > 0 ? (
          <span>
            <span className="font-medium text-gray-700">{averageRating.toFixed(1)}</span>
            {' '}average · {totalRatings} rating{totalRatings !== 1 ? 's' : ''}
          </span>
        ) : (
          <span>No ratings yet</span>
        )}
        {userRating && (
          <span className="ml-2 text-primary-600">
            · Your rating: {userRating}
          </span>
        )}
      </div>

      {!isLoggedIn && (
        <p className="text-xs text-gray-400">
          <a href={`/login?redirect=/bookmark/${bookmarkId}`} className="text-primary-600 hover:underline">
            Log in
          </a>
          {' '}to rate this bookmark
        </p>
      )}
    </div>
  )
}
