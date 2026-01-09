'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import Image from 'next/image'

interface BookmarkFaviconProps {
  faviconUrl: string | null
  title: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

const iconSizes = {
  sm: 16,
  md: 24,
  lg: 32,
}

export function BookmarkFavicon({ faviconUrl, title, size = 'md' }: BookmarkFaviconProps) {
  const [hasError, setHasError] = useState(false)

  if (!faviconUrl || hasError) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center bg-gray-100 rounded`}>
        <Bookmark className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400`} />
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
      <img
        src={faviconUrl}
        alt={`${title} favicon`}
        width={iconSizes[size]}
        height={iconSizes[size]}
        className="rounded"
        onError={() => setHasError(true)}
      />
    </div>
  )
}
