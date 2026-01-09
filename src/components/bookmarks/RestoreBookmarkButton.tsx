'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RotateCcw } from 'lucide-react'

interface RestoreBookmarkButtonProps {
  bookmarkId: string
}

export function RestoreBookmarkButton({ bookmarkId }: RestoreBookmarkButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRestore = async () => {
    setLoading(true)

    const { error } = await supabase
      .from('bookmarks')
      .update({ status: 'active' })
      .eq('id', bookmarkId)

    if (!error) {
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleRestore}
      disabled={loading}
      className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center gap-1 disabled:opacity-50"
    >
      <RotateCcw className="h-3 w-3" />
      {loading ? 'Restoring...' : 'Restore'}
    </button>
  )
}
