import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, Users, Bookmark, MessageSquare, Tag, FolderPlus, UserPlus, Archive } from 'lucide-react'
import { ApprovalActions } from '@/components/admin/ApprovalActions'

export default async function AdminApprovalsPage() {
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

  // Fetch all pending items
  const [submissions, groupRequests, groupCreationRequests, commentFlags, archiveRequests] = await Promise.all([
    // Pending bookmark submissions
    supabase
      .from('submissions')
      .select('*, submitter:submitter_user_id(name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    
    // Pending group membership requests
    supabase
      .from('group_requests')
      .select('*, user:user_id(name, email), group:group_id(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    
    // Pending group creation requests
    supabase
      .from('group_creation_requests')
      .select('*, requester:requester_id(name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    
    // Pending comment flags
    supabase
      .from('comment_flags')
      .select('*, comment:comment_id(content, bookmark_id), flagger:flagged_by(name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    
    // Pending archive requests
    supabase
      .from('archive_requests')
      .select('*, bookmark:bookmark_id(title, url), tag:tag_id(name), group:group_id(name), requester:requested_by_user_id(name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  const pendingSubmissions = submissions.data || []
  const pendingGroupRequests = groupRequests.data || []
  const pendingGroupCreationRequests = groupCreationRequests.data || []
  const pendingCommentFlags = commentFlags.data || []
  const pendingArchiveRequests = archiveRequests.data || []

  const totalPending = pendingSubmissions.length + pendingGroupRequests.length + 
    pendingGroupCreationRequests.length + pendingCommentFlags.length + pendingArchiveRequests.length

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
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
            <p className="text-gray-600">
              {totalPending === 0 
                ? 'All caught up! No pending approvals.' 
                : `${totalPending} item${totalPending !== 1 ? 's' : ''} waiting for review`}
            </p>
          </div>
        </div>
      </div>

      {totalPending === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h2>
          <p className="text-gray-600">There are no pending items requiring your approval.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Bookmark Submissions */}
          {pendingSubmissions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary-500" />
                Bookmark Submissions ({pendingSubmissions.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {pendingSubmissions.map((submission: any) => (
                  <div key={submission.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {submission.suggested_title || 'No title'}
                        </h3>
                        <a href={submission.url} target="_blank" rel="noopener noreferrer" 
                           className="text-sm text-primary-600 hover:underline truncate block">
                          {submission.url}
                        </a>
                        <p className="text-sm text-gray-500 mt-1">
                          Submitted by {submission.submitter?.name || submission.submitter_name || 'Anonymous'} • {new Date(submission.created_at).toLocaleDateString()}
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
          {pendingGroupRequests.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-500" />
                Group Membership Requests ({pendingGroupRequests.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {pendingGroupRequests.map((request: any) => (
                  <div key={request.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {request.user?.name || request.user?.email || 'Unknown user'}
                          <span className="text-gray-500 font-normal"> wants to join </span>
                          <span className="text-blue-600">{request.group?.name || 'Unknown group'}</span>
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(request.created_at).toLocaleDateString()}
                          {request.secret_code_used && (
                            <span className="ml-2 text-green-600">• Used secret code</span>
                          )}
                        </p>
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
          {pendingGroupCreationRequests.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-purple-500" />
                Group Creation Requests ({pendingGroupCreationRequests.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {pendingGroupCreationRequests.map((request: any) => (
                  <div key={request.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{request.name}</h3>
                        {request.description && (
                          <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          Requested by {request.requester?.name || request.requester?.email || 'Unknown'} • 
                          Visibility: <span className={request.visibility === 'public' ? 'text-green-600' : 'text-amber-600'}>{request.visibility}</span> • 
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ApprovalActions type="group_creation" id={request.id} requestData={request} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Comment Flags */}
          {pendingCommentFlags.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-red-500" />
                Flagged Comments ({pendingCommentFlags.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {pendingCommentFlags.map((flag: any) => (
                  <div key={flag.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-gray-900 bg-red-50 p-2 rounded border-l-4 border-red-400">
                          "{flag.comment?.content || 'Comment deleted'}"
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Flagged by {flag.flagger?.name || flag.flagger?.email || 'Anonymous'} • 
                          Reason: {flag.reason || 'No reason provided'} • 
                          {new Date(flag.created_at).toLocaleDateString()}
                        </p>
                        {flag.comment?.bookmark_id && (
                          <Link href={`/bookmark/${flag.comment.bookmark_id}`} className="text-sm text-primary-600 hover:underline">
                            View bookmark →
                          </Link>
                        )}
                      </div>
                      <ApprovalActions type="comment_flag" id={flag.id} commentId={flag.comment_id} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Archive Requests */}
          {pendingArchiveRequests.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Archive className="h-5 w-5 text-gray-500" />
                Archive Requests ({pendingArchiveRequests.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {pendingArchiveRequests.map((request: any) => (
                  <div key={request.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          Request to archive: 
                          {request.bookmark && <span className="text-primary-600"> Bookmark "{request.bookmark.title}"</span>}
                          {request.tag && <span className="text-green-600"> Tag "{request.tag.name}"</span>}
                          {request.group && <span className="text-purple-600"> Group "{request.group.name}"</span>}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Reason: {request.justification || 'No reason provided'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Requested by {request.requester?.name || request.requested_by_email || 'Anonymous'} • 
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ApprovalActions 
                        type="archive" 
                        id={request.id} 
                        bookmarkId={request.bookmark_id}
                        tagId={request.tag_id}
                        groupId={request.group_id}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
