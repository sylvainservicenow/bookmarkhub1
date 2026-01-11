import Link from 'next/link'
import { ExternalLink, Star, TrendingUp } from 'lucide-react'
import { BookmarkFavicon } from '../bookmarks/BookmarkFavicon'

interface TopRatedBookmarkCardProps {
  bookmark: {
    id: string
    title: string
    url: string
    description: string | null
    favicon_url?: string | null
    avgRating: number
    ratingCount: number
    users?: { name: string | null } | null
    bookmark_tags?: { tags: { id?: string; name: string } | null }[]
  }
}

export function TopRatedBookmarkCard({ bookmark }: TopRatedBookmarkCardProps) {
  const tags = bookmark.bookmark_tags?.map(bt => bt.tags?.name).filter(Boolean) || []
  
  // Extract domain
  let domain = ''
  try {
    domain = new URL(bookmark.url).hostname.replace('www.', '')
  } catch {}

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Upvote area */}
        <div className="flex flex-col items-center text-gray-400 pt-1">
          <TrendingUp className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <BookmarkFavicon 
              faviconUrl={bookmark.favicon_url || null} 
              title={bookmark.title} 
              size="sm" 
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/bookmark/${bookmark.id}`}
                className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-1 block text-sm"
              >
                {bookmark.title}
              </Link>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-primary-500 flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                {domain}
              </a>
            </div>
          </div>
          
          {/* Description */}
          {bookmark.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
              {bookmark.description}
            </p>
          )}
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/browse?tag=${encodeURIComponent(tag as string)}`}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded hover:bg-primary-50 hover:text-primary-700"
              >
                {tag}
              </Link>
            ))}
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${
                  star <= Math.round(bookmark.avgRating)
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-xs text-gray-600 ml-1">
              {bookmark.avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">
              ({bookmark.ratingCount})
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
