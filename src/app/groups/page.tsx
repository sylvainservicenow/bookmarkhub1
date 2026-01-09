import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, FolderOpen, Users, Lock, Globe } from 'lucide-react'
import { RequestJoinButton } from '@/components/groups/RequestJoinButton'

export default async function GroupsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get all active groups
  const { data: groups } = await supabase
    .from('groups')
    .select(`
      *,
      group_members(user_id, role)
    `)
    .eq('status', 'active')
    .order('name')
  
  // Get user's group memberships
  let userMemberships: string[] = []
  if (user) {
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
    userMemberships = memberships?.map(m => m.group_id) || []
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
      
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-green-100 rounded-lg">
          <FolderOpen className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600">Browse and join bookmark groups</p>
        </div>
      </div>
      
      {groups && groups.length > 0 ? (
        <div className="grid gap-4">
          {groups.map((group: any) => {
            const memberCount = group.group_members?.length || 0
            const isMember = userMemberships.includes(group.id)
            const isPrivate = group.visibility === 'private'
            
            return (
              <div 
                key={group.id} 
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
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
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Member
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
                      <span className="capitalize">{group.visibility}</span>
                    </div>
                  </div>
                  
                  <div className="shrink-0">
                    {!isMember && user && (
                      <RequestJoinButton groupId={group.id} groupName={group.name} />
                    )}
                    {!user && (
                      <Link
                        href={`/login?redirect=/groups`}
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
        </div>
      )}
    </div>
  )
}
