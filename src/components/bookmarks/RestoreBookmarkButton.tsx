'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RotateCcw, Loader2, CheckCircle } from 'lucide-react'

interface RestoreBookmarkButtonProps {
  bookmarkId: string
  onRestored?: () => void
}

export function RestoreBookmarkButton({ bookmarkId, onRestored }: RestoreBookmarkButtonProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRestore = async () => {
    setLoading(true)

    const { error } = await supabase
      .from('bookmarks')
      .update({ status: 'active' })
      .eq('id', bookmarkId)

    if (!error) {
      setSuccess(true)
      // Show success feedback then refresh
      setTimeout(() => {
        if (onRestored) {
          onRestored()
        } else {
          router.refresh()
        }
      }, 800)
    } else {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg animate-fade-in">
        <CheckCircle className="h-3 w-3" />
        Restored!
      </div>
    )
  }

  return (
    <button
      onClick={handleRestore}
      disabled={loading}
      className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center gap-1 disabled:opacity-50 transition-colors"
    >
      {loading ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Restoring...
        </>
      ) : (
        <>
          <RotateCcw className="h-3 w-3" />
          Restore
        </>
      )}
    </button>
  )
}
