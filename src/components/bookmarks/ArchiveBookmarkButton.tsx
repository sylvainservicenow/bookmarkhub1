'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Archive } from 'lucide-react'

interface ArchiveBookmarkButtonProps {
  bookmarkId: string
}

export function ArchiveBookmarkButton({ bookmarkId }: ArchiveBookmarkButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleArchive = async () => {
    setLoading(true)

    const { error } = await supabase
      .from('bookmarks')
      .update({ status: 'archived' })
      .eq('id', bookmarkId)

    if (!error) {
      router.refresh()
    }

    setLoading(false)
    setShowConfirm(false)
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleArchive}
          disabled={loading}
          className="px-3 py-1 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? 'Archiving...' : 'Confirm'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-3 py-1 text-sm bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 flex items-center gap-1"
    >
      <Archive className="h-3 w-3" />
      Archive
    </button>
  )
}
