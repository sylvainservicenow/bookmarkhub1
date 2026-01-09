import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Users, Plus, Settings, FolderOpen, Clock } from 'lucide-react'
import { GroupStatusSelect } from '@/components/admin/GroupStatusSelect'
import { CreateGroupForm } from '@/components/admin/CreateGroupForm'

export default async function AdminGroupsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?redirect=/admin/groups')
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

  // Get all groups with member counts
  const { data: groups } = await supabase
    .from('groups')
    .select(`
      *,
      group_members (count)
    `)
    .order('name', { ascending: true })

  // Get pending group creation requests
  const { data: pendingRequests } = await supabase
    .from('group_creation_requests')
    .select('*, requester:requester_id(name, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Get pending membership requests
  const { data: pendingMemberships } = await supabase
    .from('group_requests')
    .select('*, user:user_id(name, email), group:group_id(name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

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
            <FolderOpen className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Groups</h1>
            <p className="text-gray-600">{groups?.length || 0} groups</p>
          </div>
        </div>
      </div>

      {/* Pending Requests Alert */}
      {((pendingRequests?.length || 0) + (pendingMemberships?.length || 0)) > 0 && (
        <div className="mb-6 space-y-4">
          {/* Pending Group Creation Requests */}
          {(pendingRequests?.length || 0) > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5" />
                Pending Group Creation Requests ({pendingRequests?.length})
              </h3>
              <div className="space-y-2">
                {pendingRequests?.map((req: any) => (
                  <div key={req.id} className="bg-white rounded p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium">{req.name}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        by {req.requester?.name || req.requester?.email || 'Unknown'}
                      </span>
                    </div>
                    <Link
                      href="/admin/approvals"
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Review →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Membership Requests */}
          {(pendingMemberships?.length || 0) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-3">
                <Users className="h-5 w-5" />
                Pending Membership Requests ({pendingMemberships?.length})
              </h3>
              <div className="space-y-2">
                {pendingMemberships?.slice(0, 5).map((req: any) => (
                  <div key={req.id} className="bg-white rounded p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium">{req.user?.name || req.user?.email}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        wants to join <span className="text-blue-600">{req.group?.name}</span>
                      </span>
                    </div>
                    <Link
                      href="/admin/approvals"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Review →
                    </Link>
                  </div>
                ))}
                {(pendingMemberships?.length || 0) > 5 && (
                  <Link href="/admin/approvals" className="text-sm text-blue-600 hover:underline">
                    View all {pendingMemberships?.length} requests →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Group Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Group
        </h2>
        <CreateGroupForm />
      </div>

      {/* Groups Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Group Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Members</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Created</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {groups?.map((group: any) => (
              <tr key={group.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{group.name}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm max-w-xs truncate">
                  {group.description || '—'}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    {group.group_members?.[0]?.count || 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <GroupStatusSelect groupId={group.id} currentStatus={group.status} />
                </td>
                <td className="px-4 py-3 text-gray-500 text-sm">
                  {new Date(group.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/groups/${group.id}/edit`}
                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded inline-flex"
                    title="Edit group"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
