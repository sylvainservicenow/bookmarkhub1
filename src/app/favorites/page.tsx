'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import Link from 'next/link'
import { Heart, Loader2 } from 'lucide-react'
import { BookmarkCard } from '@/components/bookmarks/BookmarkCard'
import { BackButton } from '@/components/navigation/BackButton'

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'
  
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    if (!user?.id) return

    const fetchFavorites = async () => {
      const { data: favorites } = await supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          bookmarks!inner (
            id,
            title,
            url,
            description,
            visibility,
            status,
            created_at,
            favicon_url,
            bookmark_tags (
              tags (id, name, status)
            ),
            ratings (rating)
          )
        `)
        .eq('user_id', user.id)
        .eq('bookmarks.status', 'active')
        .order('created_at', { ascending: false })

      const bookmarksList = favorites
        ?.map(f => f.bookmarks)
        .filter(Boolean) || []

      setBookmarks(bookmarksList)
      setLoading(false)
    }

    fetchFavorites()
  }, [user?.id, supabase])

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading favorites...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Middleware will redirect
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <BackButton fallbackHref="/dashboard" label="Back" />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Heart className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Favorites</h1>
            <p className="text-gray-600">{bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} saved</p>
          </div>
        </div>
      </div>

      {/* Bookmarks list */}
      <div className="grid gap-4">
        {bookmarks.length > 0 ? (
          bookmarks.map((bookmark: any) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} />
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h2>
            <p className="text-gray-600 mb-4">
              Start exploring and save bookmarks you like!
            </p>
            <Link
              href="/browse"
              className="inline-flex px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Bookmarks
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
