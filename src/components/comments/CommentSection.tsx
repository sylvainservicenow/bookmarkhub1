'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { MessageSquare, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { CommentForm } from './CommentForm'
import { CommentList } from './CommentList'

interface Comment {
  id: string
  author_id: string
  author_name: string
  content: string
  created_at: string
  status: string
}

interface CommentSectionProps {
  bookmarkId: string
  initialComments: Comment[]
  isAdmin?: boolean
}

export function CommentSection({ bookmarkId, initialComments, isAdmin = false }: CommentSectionProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (error && error.name !== 'AuthSessionMissingError') {
          console.error('CommentSection auth error:', error)
        }
        
        if (mounted) {
          setUser(currentUser)
        }
      } catch (err) {
        console.error('CommentSection init error:', err)
      } finally {
        if (mounted) {
          setLoading(false)
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

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary-600" />
        Comments ({initialComments.length})
      </h2>
      
      {/* Comment Form */}
      <div className="mb-6">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : user ? (
          <CommentForm bookmarkId={bookmarkId} />
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600 text-sm">
              <Link href={`/login?redirect=/bookmark/${bookmarkId}`} className="text-primary-600 hover:underline">
                Log in
              </Link>
              {' '}to leave a comment
            </p>
          </div>
        )}
      </div>
      
      {/* Comments List */}
      <CommentList 
        comments={initialComments} 
        currentUserId={user?.id}
        isAdmin={isAdmin}
      />
    </div>
  )
}
