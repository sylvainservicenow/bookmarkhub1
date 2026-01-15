'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client-with-auth'
import { X, Tag, Loader2, Check, AlertCircle } from 'lucide-react'

interface RequestTagModalProps {
  isOpen: boolean
  onClose: () => void
  bookmarkId: string
  userId: string
  existingTags: string[]
}

export function RequestTagModal({ isOpen, onClose, bookmarkId, userId, existingTags }: RequestTagModalProps) {
  const [tagName, setTagName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedName = tagName.trim()
    if (!trimmedName) {
      setError('Please enter a tag name')
      return
    }

    if (trimmedName.length < 2) {
      setError('Tag name must be at least 2 characters')
      return
    }

    if (trimmedName.length > 50) {
      setError('Tag name must be less than 50 characters')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Check if tag already exists
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id, name')
        .ilike('name', trimmedName)
        .single()

      if (existingTag) {
        // Check if this tag is already on the bookmark
        const isAlreadyOnBookmark = existingTags.some(
          id => id === existingTag.id
        )
        if (isAlreadyOnBookmark) {
          setError('This tag is already applied to this bookmark')
          setLoading(false)
          return
        }
        setError(`A tag named "${existingTag.name}" already exists. Please select it from the available tags.`)
        setLoading(false)
        return
      }

      // Check if there's already a pending request for this tag on this bookmark
      const { data: existingRequest } = await supabase
        .from('tag_requests')
        .select('id')
        .eq('bookmark_id', bookmarkId)
        .ilike('tag_name', trimmedName)
        .eq('status', 'pending')
        .single()

      if (existingRequest) {
        setError('A request for this tag is already pending approval')
        setLoading(false)
        return
      }

      // Create the tag request
      const { error: insertError } = await supabase
        .from('tag_requests')
        .insert({
          tag_name: trimmedName,
          bookmark_id: bookmarkId,
          requested_by: userId,
          status: 'pending'
        })

      if (insertError) {
        throw new Error(insertError.message)
      }

      setSuccess(true)
      setTagName('')
      
      // Auto-close after success
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit tag request')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTagName('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary-600" />
            Request New Tag
          </h3>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Request Submitted!</h4>
            <p className="text-gray-600 text-sm">
              Your tag request has been submitted for admin review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-sm text-gray-600 mb-4">
              Can&apos;t find the tag you&apos;re looking for? Request a new one and an admin will review it.
            </p>

            {error && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 mb-1">
                Tag Name
              </label>
              <input
                id="tagName"
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="e.g., Performance, Security, HRSD"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-50 transition-colors"
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                2-50 characters. Use descriptive, ServiceNow-related terms.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !tagName.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
