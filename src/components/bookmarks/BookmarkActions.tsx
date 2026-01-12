'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Pencil, ExternalLink, LogIn } from 'lucide-react'
import { FavoriteButton } from './FavoriteButton'

interface BookmarkActionsProps {
  bookmarkId: string
  bookmarkUrl: string
  isArchived: boolean
  isCreator: boolean
}

export function BookmarkActions({ bookmarkId, bookmarkUrl, isArchived, isCreator }: BookmarkActionsProps) {
  const { user, loading } = useAuth()

  if (isArchived) {
    return null
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Show favorite button only if logged in */}
      {user && <FavoriteButton bookmarkId={bookmarkId} />}
      
      {/* Show login prompt if not logged in */}
      {!loading && !user && (
        <Link
          href={`/login?redirect=/bookmark/${bookmarkId}`}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          <LogIn className="h-4 w-4" />
          Sign in to interact
        </Link>
      )}
      
      {/* Edit button for creator */}
      {isCreator && (
        <Link
          href={`/bookmarks/${bookmarkId}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
      )}
      
      {/* Visit button */}
      <a
        href={bookmarkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
        Visit
      </a>
    </div>
  )
}
