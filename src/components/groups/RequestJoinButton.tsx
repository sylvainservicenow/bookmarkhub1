'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Check } from 'lucide-react'

interface RequestJoinButtonProps {
  groupId: string
  groupName: string
}

export function RequestJoinButton({ groupId, groupName }: RequestJoinButtonProps) {
  const [loading, setLoading] = useState(false)
  const [requested, setRequested] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRequest = async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push(`/login?redirect=/groups`)
      return
    }

    // Check if already a member or has pending request
    const { data: existing } = await supabase
      .from('group_members')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      if (existing.status === 'pending') {
        setError('You already have a pending request')
      } else {
        setError('You are already a member')
      }
      setLoading(false)
      return
    }

    // Create membership request
    const { error: insertError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
        status: 'pending',
      })

    if (insertError) {
      setError(insertError.message)
    } else {
      setRequested(true)
    }

    setLoading(false)
  }

  if (requested) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm">
        <Check className="h-4 w-4" />
        Request sent
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleRequest}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        <UserPlus className="h-4 w-4" />
        {loading ? 'Requesting...' : 'Request to Join'}
      </button>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  )
}
