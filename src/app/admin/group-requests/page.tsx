import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Users, Check, X, Clock, FolderPlus } from 'lucide-react'
import { GroupRequestActions } from '@/components/admin/GroupRequestActions'

export default async function AdminGroupRequestsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?redirect=/admin/group-requests')
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

  // Get group creation requests with requester info
  const { data: requests } = await supabase
    .from('group_creation_requests')
    .select(`
      *,
      requester:requester_id (id, name, email)
    `)
    .order('created_at', { ascending: false })

  const pendingRequests = requests?.filter(r => r.status === 'pending') || []
  const processedRequests = requests?.filter(r => r.status !== 'pending') || []

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
          <div className="p-2 bg-purple-100 rounded-lg">
            <FolderPlus className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Group Creation Requests</h1>
            <p className="text-gray-600">Review and approve new group requests</p>
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Pending Requests ({pendingRequests.length})
        </h2>
        
        {pendingRequests.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <FolderPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No pending group creation requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request: any) => (
              <div
                key={request.id}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {request.name}
                    </h3>
                    {request.description && (
                      <p className="text-gray-600 text-sm mb-3">{request.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          Requested by: {request.requester?.name || request.requester?.email || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        Visibility: <span className={`font-medium ${request.visibility === 'public' ? 'text-green-600' : 'text-amber-600'}`}>
                          {request.visibility}
                        </span>
                      </div>
                      <div>
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <GroupRequestActions requestId={request.id} requestName={request.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Group Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Requester</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {processedRequests.map((request: any) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{request.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {request.requester?.name || request.requester?.email || 'Unknown'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                        request.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {request.status === 'approved' ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(request.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
