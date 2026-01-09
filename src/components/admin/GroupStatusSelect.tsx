'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface GroupStatusSelectProps {
  groupId: string
  currentStatus: string
}

export function GroupStatusSelect({ groupId, currentStatus }: GroupStatusSelectProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = async (newStatus: string) => {
    setLoading(true)
    setStatus(newStatus)

    const { error } = await supabase
      .from('groups')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', groupId)

    if (error) {
      console.error('Error updating group status:', error)
      setStatus(currentStatus)
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className={`px-2 py-1 text-xs rounded border outline-none ${
        status === 'active' 
          ? 'bg-green-50 text-green-700 border-green-200' 
          : 'bg-gray-50 text-gray-600 border-gray-200'
      } ${loading ? 'opacity-50' : ''}`}
    >
      <option value="active">Active</option>
      <option value="archived">Archived</option>
    </select>
  )
}
