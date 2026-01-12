'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, UserMinus, Loader2, Shield } from 'lucide-react'

interface Member {
  id: string
  user_id: string
  role: string
  status: string
  created_at: string
  users: {
    id: string
    name: string | null
    email: string
  } | null
}

interface GroupMembersListProps {
  groupId: string
  members: Member[]
}

export function GroupMembersList({ groupId, members }: GroupMembersListProps) {
  const [removing, setRemoving] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRemove = async (memberId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from this group?`)) return

    setRemoving(memberId)

    await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId)

    setRemoving(null)
    router.refresh()
  }

  const activeMembers = members.filter(m => m.status === 'active')
  const pendingMembers = members.filter(m => m.status === 'pending')

  return (
    <div className="space-y-4">
      {pendingMembers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-amber-700 mb-2">Pending Requests ({pendingMembers.length})</h4>
          <div className="space-y-2">
            {pendingMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.users?.name || member.users?.email || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">{member.users?.email}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Active Members ({activeMembers.length})</h4>
        {activeMembers.length > 0 ? (
          <div className="space-y-2">
            {activeMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {member.users?.name || member.users?.email || 'Unknown'}
                      {member.role === 'admin' && (
                        <span className="flex items-center gap-1 text-xs text-purple-600">
                          <Shield className="h-3 w-3" />
                          Admin
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{member.users?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(member.id, member.users?.name || member.users?.email || 'this member')}
                  disabled={removing === member.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Remove from group"
                >
                  {removing === member.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No active members yet.</p>
        )}
      </div>
    </div>
  )
}
