'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2 } from 'lucide-react'
import { User } from '@supabase/supabase-js'

interface CommentFormProps {
  bookmarkId: string
}

export function CommentForm({ bookmarkId }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (error && error.name !== 'AuthSessionMissingError') {
          console.error('CommentForm auth error:', error)
        }
        
        if (mounted) {
          setUser(currentUser)
        }
      } catch (err) {
        console.error('CommentForm init error:', err)
      } finally {
        if (mounted) {
          setCheckingAuth(false)
        }
      }
    }
    
    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return
    
    if (!user) {
      router.push(`/login?redirect=/bookmark/${bookmarkId}`)
      return
    }
    
    setLoading(true)
    setError(null)

    try {
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
    } catch (err) {
      console.error('Comment submit error:', err)
      setError('Failed to post comment')
    } finally {
      setLoading(false)
    }
  }

  // Show nothing while checking auth (parent component handles login prompt)
  if (checkingAuth) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    )
  }

  // If not logged in, don't show the form (parent handles login prompt)
  if (!user) {
    return null
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
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  )
}
