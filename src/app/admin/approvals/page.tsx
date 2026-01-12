import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, CheckSquare, Users, FolderPlus, FileText } from 'lucide-react'
import { ApprovalActions } from '@/components/admin/ApprovalActions'
import { AddToGroupApprovals } from '@/components/admin/AddToGroupApprovals'

export default async function ApprovalsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?redirect=/admin/approvals')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get pending bookmark submissions
  const { data: pendingSubmissions } = await supabase
    .from('submissions')
    .select('*, submitter:submitter_user_id(name, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Get pending group membership requests
  const { data: pendingMembershipRequests } = await supabase
    .from('group_requests')
    .select('*, user:user_id(name, email), group:group_id(name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Get pending group creation requests
  const { data: pendingGroupCreationRequests } = await supabase
    .from('group_creation_requests')
    .select('*, requester:requester_id(name, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Get pending add-to-group requests
  const { data: pendingAddToGroupRequests } = await supabase
    .from('add_to_group_requests')
    .select(`
      *,
      bookmark:bookmark_id(id, title, url),
      group:group_id(id, name),
      requester:requested_by(id, name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const totalPending = 
    (pendingSubmissions?.length || 0) + 
    (pendingMembershipRequests?.length || 0) + 
    (pendingGroupCreationRequests?.length || 0) +
    (pendingAddToGroupRequests?.length || 0)

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
          {(pendingSubmissions?.length || 0) > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Bookmark Submissions ({pendingSubmissions?.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {pendingSubmissions?.map((submission: any) => (
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
                            "{submission.justification}"
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
          {(pendingMembershipRequests?.length || 0) > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Group Membership Requests ({pendingMembershipRequests?.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {pendingMembershipRequests?.map((request: any) => (
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
                            "{request.justification}"
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
          {(pendingGroupCreationRequests?.length || 0) > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-purple-500" />
                Group Creation Requests ({pendingGroupCreationRequests?.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {pendingGroupCreationRequests?.map((request: any) => (
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
          <AddToGroupApprovals requests={pendingAddToGroupRequests || []} />
        </div>
      )}
    </div>
  )
}
