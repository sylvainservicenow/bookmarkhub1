'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import Link from 'next/link'
import { ArrowLeft, CheckSquare, Users, FolderPlus, FileText, Loader2 } from 'lucide-react'
import { ApprovalActions } from '@/components/admin/ApprovalActions'
import { AddToGroupApprovals } from '@/components/admin/AddToGroupApprovals'

interface Submission {
  id: string
  url: string
  suggested_title: string | null
  justification: string | null
  submitter_email: string
  submitter: { name: string | null; email: string } | null
}

interface MembershipRequest {
  id: string
  secret_code_used: string | null
  justification: string | null
  user_id: string
  group_id: string
  user: { name: string | null; email: string } | null
  group: { name: string } | null
}

interface GroupCreationRequest {
  id: string
  name: string
  description: string | null
  visibility: string
  requester: { name: string | null; email: string } | null
}

interface AddToGroupRequest {
  id: string
  bookmark_id: string
  group_id: string
  requested_by: string
  status: string
  created_at: string
  bookmark: { id: string; title: string; url: string } | null
  group: { id: string; name: string } | null
  requester: { id: string; name: string | null; email: string } | null
}

export default function ApprovalsPage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'
  
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([])
  const [pendingMembershipRequests, setPendingMembershipRequests] = useState<MembershipRequest[]>([])
  const [pendingGroupCreationRequests, setPendingGroupCreationRequests] = useState<GroupCreationRequest[]>([])
  const [pendingAddToGroupRequests, setPendingAddToGroupRequests] = useState<AddToGroupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    
    if (!user?.id) {
      router.push('/login?redirect=/admin/approvals')
      return
    }

    const fetchData = async () => {
      // Check if user is admin
      const { data: profileData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      if (profileData?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      // Get pending bookmark submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*, submitter:submitter_user_id(name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      setPendingSubmissions(submissions || [])

      // Get pending group membership requests
      const { data: membershipRequests } = await supabase
        .from('group_requests')
        .select('*, user:user_id(name, email), group:group_id(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      setPendingMembershipRequests(membershipRequests || [])

      // Get pending group creation requests
      const { data: groupCreationRequests } = await supabase
        .from('group_creation_requests')
        .select('*, requester:requester_id(name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      setPendingGroupCreationRequests(groupCreationRequests || [])

      // Get pending add-to-group requests
      const { data: addToGroupRequests } = await supabase
        .from('add_to_group_requests')
        .select(`
          *,
          bookmark:bookmark_id(id, title, url),
          group:group_id(id, name),
          requester:requested_by(id, name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      setPendingAddToGroupRequests(addToGroupRequests || [])
      setLoading(false)
    }

    fetchData()
  }, [user?.id, authLoading, router, supabase])

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading approvals...</span>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return null
  }

  const totalPending = 
    pendingSubmissions.length + 
    pendingMembershipRequests.length + 
    pendingGroupCreationRequests.length +
    pendingAddToGroupRequests.length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <CheckSquare className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
            <p className="text-gray-600">{totalPending} items awaiting review</p>
          </div>
        </div>
      </div>

      {totalPending === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">All caught up! No pending approvals.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Bookmark Submissions */}
          {pendingSubmissions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Bookmark Submissions ({pendingSubmissions.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {pendingSubmissions.map((submission) => (
                  <div key={submission.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {submission.suggested_title || 'Untitled'}
                        </h3>
                        <a 
                          href={submission.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          {submission.url}
                        </a>
                        <p className="text-sm text-gray-500 mt-1">
                          Submitted by {submission.submitter?.name || submission.submitter_email}
                        </p>
                        {submission.justification && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                            &quot;{submission.justification}&quot;
                          </p>
                        )}
                      </div>
                      <ApprovalActions type="submission" id={submission.id} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Group Membership Requests */}
          {pendingMembershipRequests.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Group Membership Requests ({pendingMembershipRequests.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {pendingMembershipRequests.map((request) => (
                  <div key={request.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-gray-900">
                          <span className="font-medium">{request.user?.name || request.user?.email}</span>
                          {' '}wants to join{' '}
                          <span className="font-medium text-green-600">{request.group?.name}</span>
                        </p>
                        {request.secret_code_used && (
                          <p className="text-xs text-amber-600 mt-1">
                            Used secret code: {request.secret_code_used}
                          </p>
                        )}
                        {request.justification && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                            &quot;{request.justification}&quot;
                          </p>
                        )}
                      </div>
                      <ApprovalActions type="group_membership" id={request.id} groupId={request.group_id} userId={request.user_id} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Group Creation Requests */}
          {pendingGroupCreationRequests.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-purple-500" />
                Group Creation Requests ({pendingGroupCreationRequests.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {pendingGroupCreationRequests.map((request) => (
                  <div key={request.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{request.name}</h3>
                        {request.description && (
                          <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          Requested by {request.requester?.name || request.requester?.email} • 
                          Visibility: <span className={request.visibility === 'public' ? 'text-green-600' : 'text-gray-600'}>
                            {request.visibility}
                          </span>
                        </p>
                      </div>
                      <ApprovalActions type="group_creation" id={request.id} requestData={request} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Add to Group Requests */}
          <AddToGroupApprovals requests={pendingAddToGroupRequests} />
        </div>
      )}
    </div>
  )
}
