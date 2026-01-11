import Link from 'next/link'
import { ExternalLink, Star, Award } from 'lucide-react'
import { BookmarkFavicon } from '../bookmarks/BookmarkFavicon'

interface TopRatedBookmarkCardProps {
  bookmark: {
    id: string
    title: string
    url: string
    description: string | null
    favicon_url?: string | null
    bookmark_tags?: { tags: { id?: string; name: string } | null }[]
    ratings?: { rating: number }[]
  }
  rank: number
}

export function TopRatedBookmarkCard({ bookmark, rank }: TopRatedBookmarkCardProps) {
  const ratings = bookmark.ratings || []
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : null

  const tags = bookmark.bookmark_tags?.map(bt => bt.tags?.name).filter(Boolean) || []

  // Extract domain from URL
  let domain = ''
  try {
    domain = new URL(bookmark.url).hostname.replace('www.', '')
  } catch {}

  return (
    <div className="group bg-white border border-gray-200 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:border-amber-200 hover:-translate-y-1">
      {/* Rank badge */}
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
          rank === 1 ? 'bg-amber-100 text-amber-700' :
          rank === 2 ? 'bg-gray-100 text-gray-600' :
          rank === 3 ? 'bg-orange-100 text-orange-700' :
          'bg-gray-50 text-gray-500'
        }`}>
          {rank === 1 ? <Award className="h-4 w-4" /> : rank}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title with favicon */}
          <div className="flex items-center gap-2">
            <BookmarkFavicon 
              faviconUrl={bookmark.favicon_url || null} 
              title={bookmark.title} 
              size="sm" 
            />
            <Link
              href={`/bookmark/${bookmark.id}`}
              className="text-base font-semibold text-gray-900 hover:text-primary-600 line-clamp-1 transition-colors"
            >
              {bookmark.title}
            </Link>
          </div>
          
          {/* Description */}
          {bookmark.description && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
              {bookmark.description}
            </p>
          )}
          
          {/* Stats row */}
          <div className="flex items-center flex-wrap gap-3 mt-2 text-xs">
            {domain && (
              <span className="text-gray-400">{domain}</span>
            )}
            
            {avgRating !== null && (
              <span className="flex items-center gap-1 text-amber-500 font-medium">
                <Star className="h-3.5 w-3.5 fill-current" />
                {avgRating.toFixed(1)}
                <span className="text-gray-400 font-normal">({ratings.length})</span>
              </span>
            )}
          </div>
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 3).map((tag) => (
                <Link
                  key={tag}
                  href={`/search?tag=${encodeURIComponent(tag as string)}`}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-primary-100 hover:text-primary-700 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* External link */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-gray-300 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
