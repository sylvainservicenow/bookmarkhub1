'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Loader2 } from 'lucide-react'

interface ApprovalActionsProps {
  type: 'submission' | 'group_membership' | 'group_creation' | 'comment_flag' | 'archive'
  id: string
  groupId?: string
  userId?: string
  commentId?: string
  bookmarkId?: string
  tagId?: string
  requestData?: any
}

export function ApprovalActions({ 
  type, 
  id, 
  groupId, 
  userId, 
  commentId,
  bookmarkId,
  tagId,
  requestData 
}: ApprovalActionsProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleApprove = async () => {
    setLoading('approve')
    
    try {
      switch (type) {
        case 'submission':
          // Get submission data and create bookmark
          const { data: submission } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', id)
            .single()
          
          if (submission) {
            const { data: newBookmark } = await supabase
              .from('bookmarks')
              .insert({
                url: submission.url,
                title: submission.suggested_title || 'Untitled',
                visibility: submission.is_public ? 'public' : 'restricted',
                status: 'active',
                suggested_by_name: submission.submitter_name,
                suggested_by_email: submission.submitter_email,
              })
              .select()
              .single()
            
            await supabase
              .from('submissions')
              .update({ status: 'approved', created_bookmark_id: newBookmark?.id, reviewed_at: new Date().toISOString() })
              .eq('id', id)
          }
          break

        case 'group_membership':
          // Add user to group
          if (groupId && userId) {
            await supabase.from('group_members').insert({
              group_id: groupId,
              user_id: userId,
              status: 'active',
            })
          }
          await supabase
            .from('group_requests')
            .update({ status: 'approved', reviewed_at: new Date().toISOString() })
            .eq('id', id)
          break

        case 'group_creation':
          // Create the group
          if (requestData) {
            const { data: newGroup } = await supabase
              .from('groups')
              .insert({
                name: requestData.name,
                description: requestData.description,
                status: 'active',
              })
              .select()
              .single()
            
            // Add requester as member
            if (newGroup && requestData.requester_id) {
              await supabase.from('group_members').insert({
                group_id: newGroup.id,
                user_id: requestData.requester_id,
                status: 'active',
              })
            }
          }
          await supabase
            .from('group_creation_requests')
            .update({ status: 'approved', updated_at: new Date().toISOString() })
            .eq('id', id)
          break

        case 'comment_flag':
          // Archive the flagged comment
          if (commentId) {
            await supabase
              .from('comments')
              .update({ status: 'archived' })
              .eq('id', commentId)
          }
          await supabase
            .from('comment_flags')
            .update({ status: 'approved', reviewed_at: new Date().toISOString() })
            .eq('id', id)
          break

        case 'archive':
          // Archive the item
          if (bookmarkId) {
            await supabase.from('bookmarks').update({ status: 'archived' }).eq('id', bookmarkId)
          }
          if (tagId) {
            await supabase.from('tags').update({ status: 'archived' }).eq('id', tagId)
          }
          if (groupId) {
            await supabase.from('groups').update({ status: 'archived' }).eq('id', groupId)
          }
          await supabase
            .from('archive_requests')
            .update({ status: 'approved', reviewed_at: new Date().toISOString() })
            .eq('id', id)
          break
      }

      router.refresh()
    } catch (error) {
      console.error('Error approving:', error)
      alert('Error processing approval')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    setLoading('reject')
    
    try {
      const table = {
        submission: 'submissions',
        group_membership: 'group_requests',
        group_creation: 'group_creation_requests',
        comment_flag: 'comment_flags',
        archive: 'archive_requests',
      }[type]

      await supabase
        .from(table)
        .update({ 
          status: 'rejected', 
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      router.refresh()
    } catch (error) {
      console.error('Error rejecting:', error)
      alert('Error processing rejection')
    } finally {
      setLoading(null)
    }
  }

  const approveLabel = {
    submission: 'Approve',
    group_membership: 'Approve',
    group_creation: 'Create Group',
    comment_flag: 'Remove Comment',
    archive: 'Archive',
  }[type]

  const rejectLabel = {
    submission: 'Reject',
    group_membership: 'Deny',
    group_creation: 'Reject',
    comment_flag: 'Keep Comment',
    archive: 'Keep',
  }[type]

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={handleApprove}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading === 'approve' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {approveLabel}
      </button>
      <button
        onClick={handleReject}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading === 'reject' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
        {rejectLabel}
      </button>
    </div>
  )
}
