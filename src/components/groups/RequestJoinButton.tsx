'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Check, X, Loader2, Key } from 'lucide-react'

interface RequestJoinButtonProps {
  groupId: string
  groupName: string
  hasSecretCode?: boolean
}

export function RequestJoinButton({ groupId, groupName, hasSecretCode }: RequestJoinButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [requested, setRequested] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justification, setJustification] = useState('')
  const [secretCode, setSecretCode] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleRequest = async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login?redirect=/groups')
      return
    }

    // Check if already a member or has pending request
    const { data: existing } = await supabase
      .from('group_members')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      if (existing.status === 'pending') {
        setError('You already have a pending request')
      } else {
        setError('You are already a member')
      }
      setLoading(false)
      return
    }

    // Check if secret code matches (for auto-approval)
    let autoApprove = false
    if (secretCode) {
      const { data: group } = await supabase
        .from('groups')
        .select('secret_code')
        .eq('id', groupId)
        .single()
      
      if (group?.secret_code && group.secret_code.toUpperCase() === secretCode.toUpperCase()) {
        autoApprove = true
      }
    }

    // Create membership request or direct membership
    const { error: insertError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
        status: autoApprove ? 'active' : 'pending',
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Also store the request details if not auto-approved
    if (!autoApprove) {
      await supabase
        .from('group_requests')
        .insert({
          group_id: groupId,
          user_id: user.id,
          justification: justification || null,
          secret_code_used: secretCode || null,
          status: 'pending'
        })
    }

    setRequested(true)
    setShowModal(false)
    setLoading(false)
    
    if (autoApprove) {
      router.refresh()
    }
  }

  if (requested) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm">
        <Check className="h-4 w-4" />
        Request sent
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
      >
        <UserPlus className="h-4 w-4" />
        Request to Join
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Join {groupName}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why do you want to join? (optional)
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                  placeholder="Tell us why you'd like to join this group..."
                />
              </div>

              {hasSecretCode && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Key className="h-4 w-4" />
                    Secret Code (optional)
                  </label>
                  <input
                    type="text"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono uppercase"
                    placeholder="Enter code for instant access"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If you have a secret code, you'll be approved instantly.
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequest}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
