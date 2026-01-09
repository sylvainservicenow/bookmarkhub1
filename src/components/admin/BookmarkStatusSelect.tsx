'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface BookmarkStatusSelectProps {
  bookmarkId: string
  currentStatus: string
}

export function BookmarkStatusSelect({ bookmarkId, currentStatus }: BookmarkStatusSelectProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = async (newStatus: string) => {
    setLoading(true)
    setStatus(newStatus)

    const { error } = await supabase
      .from('bookmarks')
      .update({ status: newStatus })
      .eq('id', bookmarkId)

    if (error) {
      setStatus(currentStatus)
      alert('Failed to update status')
    } else {
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className={`px-2 py-1 text-sm rounded border ${
        status === 'active' 
          ? 'bg-green-50 border-green-200 text-green-700' 
          : status === 'pending'
          ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
          : 'bg-gray-50 border-gray-200 text-gray-700'
      } disabled:opacity-50`}
    >
      <option value="active">Active</option>
      <option value="pending">Pending</option>
      <option value="archived">Archived</option>
    </select>
  )
}
