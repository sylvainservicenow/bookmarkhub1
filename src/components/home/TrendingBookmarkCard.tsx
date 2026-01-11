import Link from 'next/link'
import { ExternalLink, MessageCircle, Star, TrendingUp } from 'lucide-react'
import { BookmarkFavicon } from '../bookmarks/BookmarkFavicon'

interface TrendingBookmarkCardProps {
  bookmark: {
    id: string
    title: string
    url: string
    description: string | null
    favicon_url?: string | null
    click_count: number
    users?: { name: string | null } | null
    bookmark_tags?: { tags: { id?: string; name: string } | null }[]
    ratings?: { rating: number }[]
  }
  rank: number
}

export function TrendingBookmarkCard({ bookmark, rank }: TrendingBookmarkCardProps) {
  const ratings = bookmark.ratings || []
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : null
  
  const tags = bookmark.bookmark_tags?.map(bt => bt.tags?.name).filter(Boolean) || []
  const authorName = bookmark.users?.name || 'Anonymous'
  
  // Extract domain
  let domain = ''
  try {
    domain = new URL(bookmark.url).hostname.replace('www.', '')
  } catch {}
  
  // Get primary category from tags
  const primaryCategory = tags[0] || 'General'

  return (
    <div className="relative bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
      {/* Rank Badge */}
      <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
        {rank}
      </div>
      
      {/* Upvote Count */}
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center text-gray-400">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">{bookmark.click_count || 0}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header with favicon and title */}
          <div className="flex items-center gap-3 mb-2">
            <BookmarkFavicon 
              faviconUrl={bookmark.favicon_url || null} 
              title={bookmark.title} 
              size="md" 
            />
            <div className="min-w-0">
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
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-primary-50 hover:text-primary-700"
              >
                {tag}
              </Link>
            ))}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
            <div className="flex items-center gap-3">
              {/* Rating */}
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      avgRating && star <= Math.round(avgRating)
                        ? 'fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-gray-600 ml-1">
                  {avgRating ? avgRating.toFixed(1) : '-'}
                </span>
              </div>
              
              {/* Comments count placeholder */}
              <div className="flex items-center gap-1 text-gray-400">
                <MessageCircle className="h-3 w-3" />
                <span>0</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                {primaryCategory}
              </span>
              <span className="text-gray-400 text-xs">
                {authorName.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
