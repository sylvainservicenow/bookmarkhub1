import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ExternalLink, Star, ArrowLeft, Calendar, User, Globe } from 'lucide-react'
import { FavoriteButton } from '@/components/bookmarks/FavoriteButton'

export default async function BookmarkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: bookmark, error } = await supabase
    .from('bookmarks')
    .select(`
      *,
      users:creator_id (name, email),
      bookmark_tags (
        tags (id, name)
      ),
      ratings (rating, user_id)
    `)
    .eq('id', id)
    .single()

  if (error || !bookmark) {
    notFound()
  }

  const tags = bookmark.bookmark_tags?.map((bt: any) => bt.tags).filter(Boolean) || []
  const ratings = bookmark.ratings || []
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
    : null

  // Extract domain from URL
  let domain = ''
  try {
    domain = new URL(bookmark.url).hostname.replace('www.', '')
  } catch {}

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

      {/* Main content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{bookmark.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <FavoriteButton bookmarkId={bookmark.id} />
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

        {/* Meta info */}
        <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
          {domain && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {domain}
            </div>
          )}
          
          {avgRating !== null && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              {avgRating.toFixed(1)} ({ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'})
            </div>
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

        {/* Visibility badge */}
        <div className="mt-4">
          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
            bookmark.visibility === 'public' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {bookmark.visibility}
          </span>
        </div>
      </div>
    </div>
  )
}
