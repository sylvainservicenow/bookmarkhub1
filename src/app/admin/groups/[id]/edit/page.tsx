import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, FolderOpen, Users, Settings } from 'lucide-react'
import { GroupSecretCodeEditor } from '@/components/admin/GroupSecretCodeEditor'
import { GroupMembersList } from '@/components/admin/GroupMembersList'
import { GroupStatusSelect } from '@/components/admin/GroupStatusSelect'

export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  // Get group details
  const { data: group, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !group) {
    redirect('/admin/groups')
  }

  // Get group members
  const { data: members } = await supabase
    .from('group_members')
    .select(`
      *,
      users!group_members_user_id_fkey(id, name, email)
    `)
    .eq('group_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/groups"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Groups
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Settings className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Group</h1>
            <p className="text-gray-600">{group.name}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Group Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Group Details
          </h2>
          
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p className="text-gray-900">{group.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p className="text-gray-900">{group.description || '—'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <GroupStatusSelect groupId={group.id} currentStatus={group.status} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <p className="text-gray-900 capitalize">{group.visibility || 'private'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
              <p className="text-gray-600 text-sm">
                {new Date(group.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Secret Code */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Access Settings</h2>
          <GroupSecretCodeEditor groupId={group.id} currentCode={group.secret_code} />
        </div>

        {/* Members */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({members?.filter((m: any) => m.status === 'active').length || 0})
          </h2>
          <GroupMembersList groupId={group.id} members={members || []} />
        </div>
      </div>
    </div>
  )
}
