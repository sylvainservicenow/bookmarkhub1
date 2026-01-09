'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserRoleSelectProps {
  userId: string
  currentRole: string
  disabled?: boolean
}

export function UserRoleSelect({ userId, currentRole, disabled }: UserRoleSelectProps) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = async (newRole: string) => {
    setLoading(true)
    setRole(newRole)

    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      setRole(currentRole)
      alert('Failed to update role')
    } else {
      router.refresh()
    }

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
