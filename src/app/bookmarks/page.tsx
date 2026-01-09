import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Bookmark, ArrowLeft, Plus, Archive } from 'lucide-react'
import { BookmarkCard } from '@/components/bookmarks/BookmarkCard'
import { ArchiveBookmarkButton } from '@/components/bookmarks/ArchiveBookmarkButton'
import { RestoreBookmarkButton } from '@/components/bookmarks/RestoreBookmarkButton'

export default async function MyBookmarksPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?redirect=/bookmarks')
  }

  // Get active bookmarks
  const { data: activeBookmarks } = await supabase
    .from('bookmarks')
    .select(`
      *,
      bookmark_tags (
        tags (id, name)
      ),
      ratings (rating)
    `)
    .eq('creator_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Get archived bookmarks
  const { data: archivedBookmarks } = await supabase
    .from('bookmarks')
    .select(`
      *,
      bookmark_tags (
        tags (id, name)
      ),
      ratings (rating)
    `)
    .eq('creator_id', user.id)
    .eq('status', 'archived')
    .order('created_at', { ascending: false })

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
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Bookmark className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Bookmarks</h1>
              <p className="text-gray-600">
                {activeBookmarks?.length || 0} active
                {archivedBookmarks && archivedBookmarks.length > 0 && ` · ${archivedBookmarks.length} archived`}
              </p>
            </div>
          </div>
          
          <Link
            href="/submit"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add New
          </Link>
        </div>
      </div>

      {/* Active Bookmarks */}
      <div className="space-y-4">
        {activeBookmarks && activeBookmarks.length > 0 ? (
          activeBookmarks.map((bookmark: any) => (
            <div key={bookmark.id} className="relative">
              <BookmarkCard bookmark={bookmark} />
              <div className="absolute top-4 right-14 flex gap-2">
                <Link
                  href={`/bookmarks/${bookmark.id}/edit`}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Edit
                </Link>
                <ArchiveBookmarkButton bookmarkId={bookmark.id} />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">No bookmarks yet</h2>
            <p className="text-gray-600 mb-4">
              Start sharing useful links with the community!
            </p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Submit Your First Bookmark
            </Link>
          </div>
        )}
      </div>

      {/* Archived Bookmarks */}
      {archivedBookmarks && archivedBookmarks.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Archive className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-600">Archived</h2>
          </div>
          <div className="space-y-4 opacity-75">
            {archivedBookmarks.map((bookmark: any) => (
              <div key={bookmark.id} className="relative">
                <BookmarkCard bookmark={bookmark} />
                <div className="absolute top-4 right-14 flex gap-2">
                  <RestoreBookmarkButton bookmarkId={bookmark.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
