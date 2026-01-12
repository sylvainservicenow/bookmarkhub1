'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Loader2, FolderPlus, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface AddToGroupRequest {
  id: string
  bookmark_id: string
  group_id: string
  requested_by: string
  status: string
  created_at: string
  bookmark: {
    id: string
    title: string
    url: string
  } | null
  group: {
    id: string
    name: string
  } | null
  requester: {
    id: string
    name: string | null
    email: string
  } | null
}

interface AddToGroupApprovalsProps {
  requests: AddToGroupRequest[]
}

export function AddToGroupApprovals({ requests }: AddToGroupApprovalsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleApprove = async (request: AddToGroupRequest) => {
    setLoading(request.id)

    const { data: { user } } = await supabase.auth.getUser()

    // Add bookmark to group
    await supabase
      .from('bookmark_groups')
      .insert({
        bookmark_id: request.bookmark_id,
        group_id: request.group_id
      })

    // Update request status
    await supabase
      .from('add_to_group_requests')
      .update({
        status: 'approved',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', request.id)

    setLoading(null)
    router.refresh()
  }

  const handleReject = async (requestId: string) => {
    const reason = prompt('Rejection reason (optional):')
    if (reason === null) return

    setLoading(requestId)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('add_to_group_requests')
      .update({
        status: 'rejected',
        admin_notes: reason || null,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId)

    setLoading(null)
    router.refresh()
  }

  if (requests.length === 0) {
    return null
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FolderPlus className="h-5 w-5 text-indigo-500" />
        Add to Group Requests ({requests.length})
      </h2>
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {requests.map((request) => (
          <div key={request.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/bookmark/${request.bookmark_id}`}
                    className="font-medium text-gray-900 hover:text-primary-600 truncate"
                  >
                    {request.bookmark?.title || 'Unknown bookmark'}
                  </Link>
                  <a
                    href={request.bookmark?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="text-gray-500">Requested by</span>{' '}
                  <span className="font-medium">{request.requester?.name || request.requester?.email}</span>{' '}
                  <span className="text-gray-500">to add to</span>{' '}
                  <span className="font-medium text-indigo-600">{request.group?.name}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleApprove(request)}
                  disabled={loading === request.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading === request.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><Check className="h-4 w-4" /> Approve</>
                  )}
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={loading === request.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
