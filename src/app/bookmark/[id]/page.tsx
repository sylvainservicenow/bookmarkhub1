import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ExternalLink, ArrowLeft, Calendar, User, Globe, Archive, MessageSquare } from 'lucide-react'
import { FavoriteButton } from '@/components/bookmarks/FavoriteButton'
import { RatingStars } from '@/components/bookmarks/RatingStars'
import { CommentForm } from '@/components/comments/CommentForm'
import { CommentList } from '@/components/comments/CommentList'

export default async function BookmarkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check if user is admin
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  const { data: bookmark, error } = await supabase
    .from('bookmarks')
    .select(`
      *,
      users:creator_id (name, email),
      bookmark_tags (
        tags (id, name, status)
      ),
      ratings (rating, user_id),
      comments (id, author_id, author_name, content, created_at, status)
    `)
    .eq('id', id)
    .single()

  if (error || !bookmark) {
    notFound()
  }

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

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
          <h1 className="text-2xl font-bold text-gray-900">{bookmark.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            {!isArchived && <FavoriteButton bookmarkId={bookmark.id} />}
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Visit
            </a>
          </div>
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
                href={`/search?tag=${encodeURIComponent(tag.name)}`}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Rating Section */}
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
              href={`/search?domain=${encodeURIComponent(domain)}`}
              className="flex items-center gap-2 hover:text-primary-600"
            >
              <Globe className="h-4 w-4" />
              {domain}
            </Link>
          )}

          {bookmark.click_count > 0 && (
            <div className="flex items-center gap-2">
              {bookmark.click_count} clicks
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {new Date(bookmark.created_at).toLocaleDateString()}
          </div>

          {bookmark.users && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {bookmark.users.name || bookmark.users.email?.split('@')[0]}
            </div>
          )}
        </div>

        {/* Status badges */}
        <div className="mt-4 flex gap-2">
          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
            bookmark.visibility === 'public' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {bookmark.visibility}
          </span>
          {isArchived && (
            <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
              archived
            </span>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {!isArchived && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary-600" />
            Comments ({comments.length})
          </h2>
          
          {/* Comment Form */}
          {user ? (
            <div className="mb-6">
              <CommentForm bookmarkId={bookmark.id} />
            </div>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600 text-sm">
                <Link href={`/login?redirect=/bookmark/${bookmark.id}`} className="text-primary-600 hover:underline">
                  Log in
                </Link>
                {' '}to leave a comment
              </p>
            </div>
          )}
          
          {/* Comments List */}
          <CommentList 
            comments={comments} 
            currentUserId={user?.id}
            isAdmin={isAdmin}
          />
        </div>
      )}
    </div>
  )
}
