import Link from 'next/link'
import { ExternalLink, Star } from 'lucide-react'

interface BookmarkCardProps {
  bookmark: {
    id: string
    title: string
    url: string
    description: string | null
    bookmark_tags?: { tags: { name: string } | null }[]
    ratings?: { rating: number }[]
  }
}

export function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const avgRating = bookmark.ratings && bookmark.ratings.length > 0
    ? bookmark.ratings.reduce((sum, r) => sum + r.rating, 0) / bookmark.ratings.length
    : null

  const tags = bookmark.bookmark_tags?.map(bt => bt.tags?.name).filter(Boolean) || []

  // Extract domain from URL
  let domain = ''
  try {
    domain = new URL(bookmark.url).hostname.replace('www.', '')
  } catch {}

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/bookmark/${bookmark.id}`}
            className="text-lg font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
          >
            {bookmark.title}
          </Link>
          
          {bookmark.description && (
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
              {bookmark.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 mt-2 text-sm">
            {domain && (
              <span className="text-gray-500">{domain}</span>
            )}
            
            {avgRating !== null && (
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                {avgRating.toFixed(1)}
              </span>
            )}
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 5).map((tag) => (
                <Link
                  key={tag}
                  href={`/search?tag=${encodeURIComponent(tag as string)}`}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
        
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ExternalLink className="h-5 w-5" />
        </a>
      </div>
    </div>
  )
}
