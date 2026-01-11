'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Star } from 'lucide-react'
import { User } from '@supabase/supabase-js'

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
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const fetchUserRating = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('ratings')
      .select('rating')
      .eq('bookmark_id', bookmarkId)
      .eq('user_id', userId)
      .single()
    
    if (data) {
      setUserRating(data.rating)
    }
  }, [supabase, bookmarkId])

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        // Use getUser() instead of getSession() for more reliable auth state
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('RatingStars auth error:', error)
        }
        
        if (!mounted) return
        
        setUser(currentUser)
        
        if (currentUser) {
          await fetchUserRating(currentUser.id)
        }
      } catch (err) {
        console.error('RatingStars init error:', err)
      } finally {
        if (mounted) {
          setCheckingAuth(false)
        }
      }
    }
    
    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchUserRating(session.user.id)
      } else {
        setUserRating(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserRating])

  const handleRate = async (rating: number) => {
    if (!user) {
      router.push(`/login?redirect=/bookmark/${bookmarkId}`)
      return
    }

    setLoading(true)

    try {
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
      router.refresh()
    } catch (err) {
      console.error('Rating error:', err)
    } finally {
      setLoading(false)
    }
  }

  const displayRating = hoveredRating ?? userRating ?? 0
  const isLoggedIn = !!user

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
            disabled={loading || checkingAuth}
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
        
        {(loading || checkingAuth) && (
          <span className="ml-2 text-sm text-gray-400">
            {checkingAuth ? 'Checking...' : 'Saving...'}
          </span>
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

      {!checkingAuth && !isLoggedIn && (
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
