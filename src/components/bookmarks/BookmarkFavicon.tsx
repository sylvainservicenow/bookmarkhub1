'use client'

import { useState } from 'react'

interface BookmarkFaviconProps {
  faviconUrl: string | null
  title: string
  size?: 'sm' | 'md' | 'lg'
}

// Color palette for fallback backgrounds
const COLORS = [
  'bg-primary-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-orange-500',
]

export function BookmarkFavicon({ faviconUrl, title, size = 'sm' }: BookmarkFaviconProps) {
  const [hasError, setHasError] = useState(false)
  
  // Get consistent color based on title
  const colorIndex = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % COLORS.length
  const bgColor = COLORS[colorIndex]
  
  // Get first letter for fallback
  const firstLetter = title.charAt(0).toUpperCase()
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }
  
  const roundedClasses = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-xl',
  }

  if (!faviconUrl || hasError) {
    return (
      <div className={`${sizeClasses[size]} ${roundedClasses[size]} ${bgColor} flex items-center justify-center text-white font-semibold shrink-0`}>
        {firstLetter}
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} ${roundedClasses[size]} bg-gray-100 flex items-center justify-center overflow-hidden shrink-0`}>
      <img
        src={faviconUrl}
        alt=""
        className="w-full h-full object-contain p-1"
        onError={() => setHasError(true)}
      />
    </div>
  )
}
