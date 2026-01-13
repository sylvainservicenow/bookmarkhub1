'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Pencil, ExternalLink, LogIn, Loader2 } from 'lucide-react'
import { FavoriteButton } from './FavoriteButton'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client-with-auth'

interface BookmarkActionsProps {
  bookmarkId: string
  bookmarkUrl: string
  isArchived: boolean
  creatorId: string
}

export function BookmarkActions({ bookmarkId, bookmarkUrl, isArchived, creatorId }: BookmarkActionsProps) {
  const { data: session, status } = useSession()
  const user = session?.user
  const loading = status === 'loading'
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Check if user is admin
  useEffect(() => {
    if (user?.id) {
      const checkAdmin = async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        setIsAdmin(data?.role === 'admin')
      }
      checkAdmin()
    }
  }, [user?.id])
  
  const isCreator = user?.id === creatorId
  const canEdit = isCreator || isAdmin

  // Track click and open URL
  const handleVisit = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Track the click asynchronously
    try {
      fetch(`/api/bookmarks/${bookmarkId}/click`, { method: 'POST' })
    } catch (err) {
      // Silently fail - don't block navigation
    }
    
    // Open URL immediately
    window.open(bookmarkUrl, '_blank', 'noopener,noreferrer')
  }

  if (isArchived) {
    return null
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      )}
      
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
      
      {/* Edit button for creator or admin */}
      {canEdit && (
        <Link
          href={`/bookmarks/${bookmarkId}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
      )}
      
      {/* Visit button with click tracking */}
      <button
        onClick={handleVisit}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
        Visit
      </button>
    </div>
  )
}
