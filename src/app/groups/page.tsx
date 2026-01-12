import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, FolderOpen, Users, Lock, Globe, Check } from 'lucide-react'
import { RequestJoinButton } from '@/components/groups/RequestJoinButton'
import { RequestNewGroupButton } from '@/components/groups/RequestNewGroupButton'
import { LeaveGroupButton } from '@/components/groups/LeaveGroupButton'

export default async function GroupsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get all active groups
  const { data: groups } = await supabase
    .from('groups')
    .select(`
      *,
      group_members(user_id, role, status)
    `)
    .eq('status', 'active')
    .order('name')
  
  // Get user's group memberships (active only)
  let userMemberships: string[] = []
  let pendingMemberships: string[] = []
  if (user) {
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id, status')
      .eq('user_id', user.id)
    
    userMemberships = memberships?.filter(m => m.status === 'active').map(m => m.group_id) || []
    pendingMemberships = memberships?.filter(m => m.status === 'pending').map(m => m.group_id) || []
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <FolderOpen className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
            <p className="text-gray-600">Browse and join bookmark groups</p>
          </div>
        </div>
        
        {/* Request New Group button (only for logged in users) */}
        {user && <RequestNewGroupButton />}
      </div>
      
      {groups && groups.length > 0 ? (
        <div className="grid gap-4">
          {groups.map((group: any) => {
            const activeMembers = group.group_members?.filter((m: any) => m.status === 'active') || []
            const memberCount = activeMembers.length
            const isMember = userMemberships.includes(group.id)
            const isPending = pendingMemberships.includes(group.id)
            const isPrivate = group.visibility === 'private'
            
            return (
              <div 
                key={group.id} 
                className={`bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow ${
                  isMember ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {group.name}
                      </h2>
                      {isPrivate ? (
                        <Lock className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Globe className="h-4 w-4 text-green-500" />
                      )}
                      {isMember && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Member
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                    
                    {group.description && (
                      <p className="text-gray-600 text-sm mt-1">
                        {group.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                      </span>
                      <span className="capitalize">{group.visibility || 'private'}</span>
                    </div>
                  </div>
                  
                  <div className="shrink-0">
                    {isMember ? (
                      <LeaveGroupButton groupId={group.id} groupName={group.name} />
                    ) : isPending ? (
                      <span className="px-4 py-2 text-sm text-amber-600 bg-amber-50 rounded-lg">
                        Request Pending
                      </span>
                    ) : user ? (
                      <RequestJoinButton groupId={group.id} groupName={group.name} hasSecretCode={!!group.secret_code} />
                    ) : (
                      <Link
                        href="/login?redirect=/groups"
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Log in to join
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No groups available yet.</p>
          {user && (
            <p className="mt-2 text-sm">
              Be the first to request a new group!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
