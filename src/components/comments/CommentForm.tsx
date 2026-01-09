'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'

interface CommentFormProps {
  bookmarkId: string
}

export function CommentForm({ bookmarkId }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return
    
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push(`/login?redirect=/bookmark/${bookmarkId}`)
      return
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single()

    const { error: insertError } = await supabase
      .from('comments')
      .insert({
        bookmark_id: bookmarkId,
        author_id: user.id,
        author_name: profile?.name || user.email?.split('@')[0],
        author_email: profile?.email || user.email,
        content: content.trim(),
        status: 'active',
      })

    if (insertError) {
      setError(insertError.message)
    } else {
      setContent('')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
        />
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-4 w-4" />
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  )
}
