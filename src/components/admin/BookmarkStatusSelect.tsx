'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface BookmarkStatusSelectProps {
  bookmarkId: string
  currentStatus: string
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-50 border-green-200 text-green-700' },
  { value: 'submitted', label: 'Submitted', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { value: 'checked', label: 'Checked', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: 'health_warning_1', label: 'Warning 1', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { value: 'health_warning_2', label: 'Warning 2', color: 'bg-orange-100 border-orange-300 text-orange-800' },
  { value: 'health_warning_3', label: 'Warning 3', color: 'bg-red-50 border-red-200 text-red-700' },
  { value: 'needs_fixing', label: 'Needs Fixing', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { value: 'hidden', label: 'Hidden', color: 'bg-gray-50 border-gray-200 text-gray-600' },
  { value: 'archived', label: 'Archived', color: 'bg-gray-100 border-gray-300 text-gray-700' },
]

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

  const currentOption = STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0]

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className={`px-2 py-1 text-sm rounded border ${currentOption.color} disabled:opacity-50 cursor-pointer`}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
