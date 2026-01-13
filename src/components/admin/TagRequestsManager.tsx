'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client-with-auth'
import { Check, X, Loader2, Clock, Tag, User, Bookmark, AlertCircle } from 'lucide-react'

interface TagRequest {
  id: string
  tag_name: string
  bookmark_id: string
  requested_by: string
  status: string
  created_at: string
  bookmarks: {
    title: string
    url: string
  }
  users: {
    name: string
    email: string
  }
}

export function TagRequestsManager() {
  const [requests, setRequests] = useState<TagRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tag_requests')
      .select(`
        *,
        bookmarks (title, url),
        users:requested_by (name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      setError('Failed to load tag requests')
      console.error(error)
    } else {
      setRequests(data || [])
    }
    setLoading(false)
  }

  const handleApprove = async (request: TagRequest) => {
    setProcessingId(request.id)
    setError(null)

    try {
      // First, check if a tag with this name already exists
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .ilike('name', request.tag_name)
        .single()

      let tagId: string

      if (existingTag) {
        // Tag already exists, use its ID
        tagId = existingTag.id
      } else {
        // Create the new tag
        const { data: newTag, error: tagError } = await supabase
          .from('tags')
          .insert({
            name: request.tag_name,
            visibility: 'public',
            status: 'active',
            created_by: request.requested_by,
          })
          .select()
          .single()

        if (tagError) {
          throw new Error('Failed to create tag: ' + tagError.message)
        }
        tagId = newTag.id
      }

      // Associate the tag with the bookmark
      const { error: linkError } = await supabase
        .from('bookmark_tags')
        .insert({
          bookmark_id: request.bookmark_id,
          tag_id: tagId,
        })

      // It's okay if link already exists (unique constraint)
      if (linkError && !linkError.message.includes('duplicate')) {
        throw new Error('Failed to link tag to bookmark: ' + linkError.message)
      }

      // Update the request status
      const { error: updateError } = await supabase
        .from('tag_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
        })
        .eq('id', request.id)

      if (updateError) {
        throw new Error('Failed to update request status')
      }

      // Remove from list
      setRequests(prev => prev.filter(r => r.id !== request.id))
    } catch (err: any) {
      setError(err.message || 'Failed to approve tag request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (request: TagRequest) => {
    setProcessingId(request.id)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('tag_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
        })
        .eq('id', request.id)

      if (updateError) {
        throw new Error('Failed to reject request')
      }

      // Remove from list
      setRequests(prev => prev.filter(r => r.id !== request.id))
    } catch (err: any) {
      setError(err.message || 'Failed to reject tag request')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Tag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No pending tag requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                      {request.tag_name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{request.bookmarks?.title || 'Unknown bookmark'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{request.users?.name || request.users?.email || 'Unknown user'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(request)}
                    disabled={processingId === request.id}
                    className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors"
                    title="Approve"
                  >
                    {processingId === request.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(request)}
                    disabled={processingId === request.id}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                    title="Reject"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
