import Link from 'next/link'
import { ExternalLink, Star, MousePointerClick, Heart } from 'lucide-react'

interface BookmarkCardProps {
  bookmark: {
    id: string
    title: string
    url: string
    description: string | null
    click_count?: number
    bookmark_tags?: { tags: { id?: string; name: string } | null }[]
    ratings?: { rating: number }[]
  }
  isFavorited?: boolean
  showFavorite?: boolean
}

export function BookmarkCard({ bookmark, isFavorited = false, showFavorite = false }: BookmarkCardProps) {
  const ratings = bookmark.ratings || []
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : null

  const tags = bookmark.bookmark_tags?.map(bt => bt.tags?.name).filter(Boolean) || []
  const clickCount = bookmark.click_count || 0

  // Extract domain from URL
  let domain = ''
  try {
    domain = new URL(bookmark.url).hostname.replace('www.', '')
  } catch {}

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title row with favorite indicator */}
          <div className="flex items-center gap-2">
            <Link
              href={`/bookmark/${bookmark.id}`}
              className="text-lg font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
            >
              {bookmark.title}
            </Link>
            {showFavorite && isFavorited && (
              <Heart className="h-4 w-4 text-red-500 fill-red-500 shrink-0" />
            )}
          </div>
          
          {/* Description */}
          {bookmark.description && (
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
              {bookmark.description}
            </p>
          )}
          
          {/* Stats row: domain, rating, clicks */}
          <div className="flex items-center flex-wrap gap-3 mt-2 text-sm">
            {domain && (
              <Link 
                href={`/search?domain=${encodeURIComponent(domain)}`}
                className="text-gray-500 hover:text-primary-600"
              >
                {domain}
              </Link>
            )}
            
            {avgRating !== null && (
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                {avgRating.toFixed(1)}
                <span className="text-gray-400 text-xs">({ratings.length})</span>
              </span>
            )}
            
            {clickCount > 0 && (
              <span className="flex items-center gap-1 text-gray-400">
                <MousePointerClick className="h-4 w-4" />
                {clickCount}
              </span>
            )}
          </div>
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 5).map((tag) => (
                <Link
                  key={tag}
                  href={`/search?tag=${encodeURIComponent(tag as string)}`}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-primary-100 hover:text-primary-700"
                >
                  {tag}
                </Link>
              ))}
              {tags.length > 5 && (
                <span className="px-2 py-0.5 text-gray-400 text-xs">
                  +{tags.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* External link button */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          title="Open in new tab"
        >
          <ExternalLink className="h-5 w-5" />
        </a>
      </div>
    </div>
  )
}
