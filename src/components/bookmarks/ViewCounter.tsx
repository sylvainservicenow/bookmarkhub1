'use client'

import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'

interface ViewCounterProps {
  bookmarkId: string
  initialCount: number
}

/**
 * Client-side view counter that only increments for real users.
 * This prevents bots from inflating view counts and causing DB writes.
 * 
 * Uses sessionStorage to prevent multiple increments in the same session.
 */
export function ViewCounter({ bookmarkId, initialCount }: ViewCounterProps) {
  const [viewCount, setViewCount] = useState(initialCount)
  const [hasIncremented, setHasIncremented] = useState(false)

  useEffect(() => {
    // Check if we've already incremented in this session
    const storageKey = `viewed_${bookmarkId}`
    const alreadyViewed = sessionStorage.getItem(storageKey)
    
    if (alreadyViewed) {
      // Already counted this session, just show the count + 1
      setViewCount(initialCount)
      return
    }

    // Only increment once per session per bookmark
    const incrementView = async () => {
      try {
        const response = await fetch(`/api/bookmarks/${bookmarkId}/view`, {
          method: 'POST',
        })
        
        if (response.ok) {
          const data = await response.json()
          setViewCount(data.click_count || initialCount + 1)
          sessionStorage.setItem(storageKey, 'true')
          setHasIncremented(true)
        }
      } catch (error) {
        // Silently fail - view count isn't critical
        console.error('Failed to increment view:', error)
      }
    }

    incrementView()
  }, [bookmarkId, initialCount])

  return (
    <div className="flex items-center gap-2">
      <Eye className="h-4 w-4" />
      {viewCount} view{viewCount !== 1 ? 's' : ''}
    </div>
  )
}
