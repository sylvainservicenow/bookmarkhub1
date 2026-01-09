'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface TagStatusSelectProps {
  tagId: string
  currentStatus: string
}

export function TagStatusSelect({ tagId, currentStatus }: TagStatusSelectProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = async (newStatus: string) => {
    setLoading(true)
    setStatus(newStatus)

    const { error } = await supabase
      .from('tags')
      .update({ status: newStatus })
      .eq('id', tagId)

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
          : 'bg-gray-50 border-gray-200 text-gray-700'
      } disabled:opacity-50`}
    >
      <option value="active">Active</option>
      <option value="archived">Archived</option>
    </select>
  )
}
