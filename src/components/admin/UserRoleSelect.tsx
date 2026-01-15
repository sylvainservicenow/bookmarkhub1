'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserRoleSelectProps {
  userId: string
  currentRole: string
  disabled?: boolean
}

export function UserRoleSelect({ userId, currentRole, disabled }: UserRoleSelectProps) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleChange = async (newRole: string) => {
    setLoading(true)
    const previousRole = role
    setRole(newRole) // Optimistic update

    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      setRole(previousRole) // Revert on error
      alert('Failed to update role')
    }
    // Removed router.refresh() - let the local state handle the UI update

    setLoading(false)
  }

  return (
    <select
      value={role}
      onChange={(e) => handleChange(e.target.value)}
      disabled={disabled || loading}
      className={`px-2 py-1 text-sm rounded border ${
        role === 'admin' 
          ? 'bg-red-50 border-red-200 text-red-700' 
          : 'bg-gray-50 border-gray-200 text-gray-700'
      } disabled:opacity-50`}
    >
      <option value="user">User</option>
      <option value="admin">Admin</option>
    </select>
  )
}
