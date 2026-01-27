import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Calendar, User, Globe, Archive, Lock, Eye } from 'lucide-react'
import { RatingStars } from '@/components/bookmarks/RatingStars'
import { BookmarkFavicon } from '@/components/bookmarks/BookmarkFavicon'
import { CommentSection } from '@/components/comments/CommentSection'
import { BookmarkActions } from '@/components/bookmarks/BookmarkActions'
import { BackButton } from '@/components/navigation/BackButton'
import { ViewCounter } from '@/components/bookmarks/ViewCounter'
import { unstable_cache } from 'next/cache'

// REMOVED force-dynamic - use ISR instead
// Revalidate every 10 minutes for individual bookmark pages
export const revalidate = 600

// Cache the bookmark data fetch
const getCachedBookmark = unstable_cache(
  async (id: string) => {
    const supabase = createAdminClient()
    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .select(`
        id,
        title,
        url,
        description,
        visibility,
        status,
        click_count,
        favicon_url,
        created_at,
        creator_id,
        users:creator_id (name, email),
        bookmark_tags (
          tags (id, name, status)
        ),
        ratings (rating, user_id),
        comments (id, author_id, author_name, content, created_at, status)
      `)
      .eq('id', id)
      .single()
    
    if (error || !bookmark) return null
    return bookmark
  },
  ['bookmark-detail'],
  { revalidate: 600, tags: ['bookmarks'] }
)

export default async function BookmarkPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  
  const bookmark = await getCachedBookmark(id)

  if (!bookmark) {
    notFound()
  }

  // REMOVED: Server-side view count increment
  // This was causing a DB write on every page load (including bots!)
  // Now handled by client-side ViewCounter component

  // Filter to only show active tags
  const tags = bookmark.bookmark_tags
    ?.map((bt: any) => bt.tags)
    .filter((tag: any) => tag && tag.status === 'active') || []
  
  const ratings = bookmark.ratings || []
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
    : 0

  // Filter to only show active comments, sorted by date
  const comments = (bookmark.comments || [])
    .filter((c: any) => c.status === 'active')
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Extract domain from URL
  let domain = ''
  try {
    domain = new URL(bookmark.url).hostname.replace('www.', '')
  } catch {}

  const isArchived = bookmark.status === 'archived'
  const isPrivate = bookmark.visibility === 'private'
  
  // Handle users - could be array or single object from Supabase join
  const userObj = Array.isArray(bookmark.users) ? bookmark.users[0] : bookmark.users

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <div className="mb-6">
        <BackButton fallbackHref="/browse" label="Back" />
      </div>

      {/* Archived banner */}
      {isArchived && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
          <Archive className="h-5 w-5" />
          <span>This bookmark has been archived</span>
        </div>
      )}

      {/* Main content */}
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${isArchived ? 'opacity-75' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <BookmarkFavicon 
              faviconUrl={bookmark.favicon_url} 
              title={bookmark.title} 
              size="lg" 
            />
            <h1 className="text-2xl font-bold text-gray-900">{bookmark.title}</h1>
          </div>
          
          {/* Actions - Client component handles auth state */}
          <BookmarkActions 
            bookmarkId={bookmark.id}
            bookmarkUrl={bookmark.url}
            isArchived={isArchived}
            creatorId={bookmark.creator_id}
          />
        </div>

        {/* URL */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:underline break-all text-sm"
        >
          {bookmark.url}
        </a>

        {/* Description */}
        {bookmark.description && (
          <p className="mt-4 text-gray-600">{bookmark.description}</p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag: any) => (
              <Link
                key={tag.id}
                href={`/browse?tag=${encodeURIComponent(tag.name)}`}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Rating Section - Client component handles auth */}
        {!isArchived && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Rate this bookmark</h2>
            <RatingStars 
              bookmarkId={bookmark.id} 
              totalRatings={ratings.length}
              averageRating={avgRating}
            />
          </div>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
          {domain && (
            <Link 
              href={`/browse?domain=${encodeURIComponent(domain)}`}
              className="flex items-center gap-2 hover:text-primary-600 transition-colors"
            >
              <Globe className="h-4 w-4" />
              {domain}
            </Link>
          )}

          {/* Client-side view counter - only increments for real users */}
          <ViewCounter 
            bookmarkId={bookmark.id} 
            initialCount={bookmark.click_count || 0} 
          />

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {new Date(bookmark.created_at).toLocaleDateString()}
          </div>

          {userObj && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {userObj.name || userObj.email?.split('@')[0]}
            </div>
          )}
        </div>

        {/* Visibility badge */}
        <div className="mt-4 flex gap-2">
          {isPrivate ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
              <Lock className="h-3 w-3" />
              Private
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
              <Globe className="h-3 w-3" />
              Public
            </span>
          )}
          {isArchived && (
            <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
              archived
            </span>
          )}
        </div>
      </div>

      {/* Comments Section - Client component handles its own auth */}
      {!isArchived && (
        <CommentSection 
          bookmarkId={bookmark.id}
          initialComments={comments}
        />
      )}
    </div>
  )
}
