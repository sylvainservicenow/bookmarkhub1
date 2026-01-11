'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Archive, Loader2, CheckCircle } from 'lucide-react'

interface ArchiveBookmarkButtonProps {
  bookmarkId: string
  onArchived?: () => void
}

export function ArchiveBookmarkButton({ bookmarkId, onArchived }: ArchiveBookmarkButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleArchive = async () => {
    setLoading(true)

    const { error } = await supabase
      .from('bookmarks')
      .update({ status: 'archived' })
      .eq('id', bookmarkId)

    if (!error) {
      setSuccess(true)
      // Show success feedback then refresh
      setTimeout(() => {
        if (onArchived) {
          onArchived()
        } else {
          router.refresh()
        }
      }, 800)
    } else {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg animate-fade-in">
        <CheckCircle className="h-3 w-3" />
        Archived!
      </div>
    )
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 animate-fade-in">
        <button
          onClick={handleArchive}
          disabled={loading}
          className="px-3 py-1 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Archiving...
            </>
          ) : (
            'Confirm'
          )}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-3 py-1 text-sm bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 flex items-center gap-1 transition-colors"
    >
      <Archive className="h-3 w-3" />
      Archive
    </button>
  )
}
