'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink } from 'lucide-react'

interface VisitButtonProps {
  bookmarkId: string
  url: string
  clickCount: number
}

export function VisitButton({ bookmarkId, url, clickCount: initialClickCount }: VisitButtonProps) {
  const [clickCount, setClickCount] = useState(initialClickCount)
  const supabase = createClient()

  const handleClick = async () => {
    // Optimistically update the UI
    setClickCount(prev => prev + 1)

    // Track the click in the database
    try {
      // Get current user (optional - clicks can be anonymous)
      const { data: { user } } = await supabase.auth.getUser()

      // Insert into bookmark_clicks log
      await supabase.from('bookmark_clicks').insert({
        bookmark_id: bookmarkId,
        user_id: user?.id || null,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      })

      // Increment click_count on the bookmark
      await supabase.rpc('increment_click_count', { bookmark_id: bookmarkId })
    } catch (error) {
      console.error('Error tracking click:', error)
      // Don't block the navigation even if tracking fails
    }

    // Open the URL in a new tab
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
    >
      <ExternalLink className="h-4 w-4" />
      Visit
      {clickCount > 0 && (
        <span className="text-xs bg-primary-700 px-1.5 py-0.5 rounded">
          {clickCount}
        </span>
      )}
    </button>
  )
}
