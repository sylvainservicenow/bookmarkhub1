'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserStatusToggleProps {
  userId: string
  currentStatus: string
  disabled?: boolean
}

export function UserStatusToggle({ userId, currentStatus, disabled }: UserStatusToggleProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleChange = async (newStatus: string) => {
    setLoading(true)
    const previousStatus = status
    setStatus(newStatus) // Optimistic update

    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', userId)

    if (error) {
      setStatus(previousStatus) // Revert on error
      alert('Failed to update status')
    }
    // Removed router.refresh() - let the local state handle the UI update

    setLoading(false)
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={disabled || loading}
      className={`px-2 py-1 text-sm rounded border ${
        status === 'active' 
          ? 'bg-green-50 border-green-200 text-green-700' 
          : status === 'suspended'
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-gray-50 border-gray-200 text-gray-700'
      } disabled:opacity-50`}
    >
      <option value="active">Active</option>
      <option value="archived">Archived</option>
      <option value="suspended">Suspended</option>
    </select>
  )
}
