import Link from 'next/link'
import { ExternalLink, MessageCircle, Star, TrendingUp, Clock, User } from 'lucide-react'
import { BookmarkFavicon } from '../bookmarks/BookmarkFavicon'

interface BrowseBookmarkCardProps {
  bookmark: {
    id: string
    title: string
    url: string
    description: string | null
    favicon_url?: string | null
    click_count?: number
    created_at: string
    users?: { id: string; name: string | null } | null
    bookmark_tags?: { tags: { id?: string; name: string } | null }[]
    ratings?: { rating: number }[]
  }
  isFavorited?: boolean
}

export function BrowseBookmarkCard({ bookmark, isFavorited }: BrowseBookmarkCardProps) {
  const ratings = bookmark.ratings || []
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : null
  
  const tags = bookmark.bookmark_tags?.map(bt => bt.tags?.name).filter(Boolean) || []
  const authorName = bookmark.users?.name || 'Anonymous'
  const primaryCategory = tags[0] || 'General'
  
  // Extract domain
  let domain = ''
  try {
    domain = new URL(bookmark.url).hostname.replace('www.', '')
  } catch {}
  
  // Format time ago
  const timeAgo = getTimeAgo(bookmark.created_at)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Upvote Section */}
        <div className="flex flex-col items-center text-gray-400 pt-1">
          <TrendingUp className="h-4 w-4 mb-1" />
          <span className="text-sm font-medium">{bookmark.click_count || 0}</span>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <BookmarkFavicon
              faviconUrl={bookmark.favicon_url || null}
              title={bookmark.title}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/bookmark/${bookmark.id}`}
                className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-1 block"
              >
                {bookmark.title}
              </Link>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-primary-500 flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                {domain}
              </a>
            </div>
          </div>
          
          {/* Description */}
          {bookmark.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {bookmark.description}
            </p>
          )}
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.slice(0, 4).map((tag) => (
              <Link
                key={tag}
                href={`/browse?tag=${encodeURIComponent(tag as string)}`}
                className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-primary-50 hover:text-primary-700"
              >
                {tag}
              </Link>
            ))}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
            <div className="flex items-center gap-4">
              {/* Rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3.5 w-3.5 ${
                      avgRating && star <= Math.round(avgRating)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-gray-600 ml-1">
                  {avgRating ? avgRating.toFixed(1) : '-'}
                </span>
              </div>
              
              {/* Comments */}
              <div className="flex items-center gap-1 text-gray-400">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>0</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-gray-500">
              {/* Category Badge */}
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                {primaryCategory}
              </span>
              
              {/* Author */}
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="text-xs">{authorName}</span>
              </div>
              
              {/* Time */}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs">{timeAgo}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
