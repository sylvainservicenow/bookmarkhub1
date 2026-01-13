'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import { FolderPlus, X, Check, Loader2 } from 'lucide-react'

interface AddToGroupButtonProps {
  bookmarkId: string
  bookmarkTitle: string
}

interface GroupType {
  id: string
  name: string
}

export function AddToGroupButton({ bookmarkId, bookmarkTitle }: AddToGroupButtonProps) {
  const { data: session } = useSession()
  const user = session?.user
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userGroups, setUserGroups] = useState<GroupType[]>([])
  const [existingGroups, setExistingGroups] = useState<string[]>([])
  const [pendingRequests, setPendingRequests] = useState<string[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!showModal || !user?.id) return

    const fetchData = async () => {
      setLoading(true)

      // Get user's groups
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, groups(id, name, status)')
        .eq('user_id', user.id)
        .eq('status', 'active')
      
      if (memberships) {
        const groups = memberships
          .map((m: any) => m.groups)
          .filter((g: any) => g && g.status === 'active')
        setUserGroups(groups)
      }

      // Get groups bookmark is already in
      const { data: bookmarkGroups } = await supabase
        .from('bookmark_groups')
        .select('group_id')
        .eq('bookmark_id', bookmarkId)
      
      setExistingGroups(bookmarkGroups?.map(bg => bg.group_id) || [])

      // Get pending requests
      const { data: requests } = await supabase
        .from('add_to_group_requests')
        .select('group_id')
        .eq('bookmark_id', bookmarkId)
        .eq('requested_by', user.id)
        .eq('status', 'pending')
      
      setPendingRequests(requests?.map(r => r.group_id) || [])

      setLoading(false)
    }

    fetchData()
  }, [showModal, bookmarkId, user?.id, supabase])

  const handleSubmit = async () => {
    if (!selectedGroupId || !user?.id) return

    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('add_to_group_requests')
      .insert({
        bookmark_id: bookmarkId,
        group_id: selectedGroupId,
        requested_by: user.id,
        status: 'pending'
      })

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess(true)
      setPendingRequests(prev => [...prev, selectedGroupId])
      setTimeout(() => {
        setShowModal(false)
        setSuccess(false)
        setSelectedGroupId(null)
      }, 1500)
    }

    setSubmitting(false)
  }

  const availableGroups = userGroups.filter(
    g => !existingGroups.includes(g.id) && !pendingRequests.includes(g.id)
  )

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-gray-600 text-sm rounded-lg hover:bg-gray-100 transition-colors"
        title="Request to add this bookmark to one of your groups"
      >
        <FolderPlus className="h-4 w-4" />
        Add to Group
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add to Group</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : success ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-gray-600">Request submitted!</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Request to add <strong>{bookmarkTitle}</strong> to one of your groups.
                  An admin will review your request.
                </p>

                {availableGroups.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {availableGroups.map(group => (
                      <button
                        key={group.id}
                        onClick={() => setSelectedGroupId(group.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                          selectedGroupId === group.id
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    {userGroups.length === 0
                      ? "You're not a member of any groups yet."
                      : "This bookmark is already in all your groups or has pending requests."}
                  </p>
                )}

                {error && (
                  <p className="text-sm text-red-600 mb-4">{error}</p>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedGroupId || submitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
