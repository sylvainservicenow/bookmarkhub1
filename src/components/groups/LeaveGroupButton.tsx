'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import { LogOut, Loader2 } from 'lucide-react'

interface LeaveGroupButtonProps {
  groupId: string
  groupName: string
}

export function LeaveGroupButton({ groupId, groupName }: LeaveGroupButtonProps) {
  const { data: session } = useSession()
  const user = session?.user
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLeave = async () => {
    if (!user?.id) {
      router.push('/login')
      return
    }

    setLoading(true)

    // Delete from group_members
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id)

    setLoading(false)
    setShowConfirm(false)
    router.refresh()
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Leave {groupName}?</span>
        <button
          onClick={handleLeave}
          disabled={loading}
          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-2 px-3 py-1.5 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Leave Group
    </button>
  )
}
