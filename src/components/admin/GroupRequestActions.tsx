'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Loader2 } from 'lucide-react'

interface GroupRequestActionsProps {
  requestId: string
  requestName: string
}

export function GroupRequestActions({ requestId, requestName }: GroupRequestActionsProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleApprove = async () => {
    if (!confirm(`Approve and create the group "${requestName}"?`)) return
    
    setLoading('approve')
    
    try {
      // Get the request details
      const { data: request, error: fetchError } = await supabase
        .from('group_creation_requests')
        .select('*')
        .eq('id', requestId)
        .single()
      
      if (fetchError || !request) {
        alert('Error fetching request details')
        setLoading(null)
        return
      }

      // Create the group
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: request.name,
          description: request.description,
          status: 'active',
        })
        .select()
        .single()

      if (groupError) {
        alert(`Error creating group: ${groupError.message}`)
        setLoading(null)
        return
      }

      // Add the requester as a member of the new group
      if (request.requester_id && newGroup) {
        await supabase
          .from('group_members')
          .insert({
            user_id: request.requester_id,
            group_id: newGroup.id,
            status: 'active',
          })
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('group_creation_requests')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (updateError) {
        alert(`Error updating request: ${updateError.message}`)
        setLoading(null)
        return
      }

      router.refresh()
    } catch (error) {
      console.error('Error approving request:', error)
      alert('An error occurred')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    const reason = prompt('Rejection reason (optional):')
    if (reason === null) return // User cancelled
    
    setLoading('reject')
    
    try {
      const { error } = await supabase
        .from('group_creation_requests')
        .update({ 
          status: 'rejected',
          admin_notes: reason || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) {
        alert(`Error rejecting request: ${error.message}`)
        setLoading(null)
        return
      }

      router.refresh()
    } catch (error) {
      console.error('Error rejecting request:', error)
      alert('An error occurred')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleApprove}
        disabled={loading !== null}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading === 'approve' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        Approve
      </button>
      <button
        onClick={handleReject}
        disabled={loading !== null}
        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading === 'reject' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
        Reject
      </button>
    </div>
  )
}
