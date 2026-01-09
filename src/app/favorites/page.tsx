import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Heart, ArrowLeft } from 'lucide-react'
import { BookmarkCard } from '@/components/bookmarks/BookmarkCard'

export default async function FavoritesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?redirect=/favorites')
  }

  // Only get favorites for active bookmarks
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
        bookmark_tags (
          tags (id, name, status)
        ),
        ratings (rating)
      )
    `)
    .eq('user_id', user.id)
    .eq('bookmarks.status', 'active')
    .order('created_at', { ascending: false })

  const bookmarks = favorites
    ?.map(f => f.bookmarks)
    .filter(Boolean) || []

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        
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
              href="/search"
              className="inline-flex px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Browse Bookmarks
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
