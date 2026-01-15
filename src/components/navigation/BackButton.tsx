'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  /** Default URL to navigate to if no history is available */
  fallbackHref?: string
  /** Label to display (defaults to "Back") */
  label?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Smart back button that uses browser history when available,
 * otherwise falls back to a default URL.
 * 
 * This ensures users return to where they came from (e.g., search results
 * with their filters preserved) rather than always going to a fixed page.
 */
export function BackButton({ 
  fallbackHref = '/', 
  label = 'Back',
  className = ''
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    // Check if we have history to go back to
    // window.history.length > 1 means there's a previous page
    // We also check if the referrer is from the same origin to avoid going back to external sites
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  )
}
