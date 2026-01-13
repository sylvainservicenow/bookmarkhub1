'use client'

import Link from 'next/link'
import { Star, ExternalLink, Heart, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { BookmarkFavicon } from '@/components/bookmarks/BookmarkFavicon'
import { ActiveFiltersBar } from './ActiveFiltersBar'

interface BookmarkListProps {
  bookmarks: any[]
  userFavorites: string[]
  totalCount: number
  query?: string
  selectedTags?: string[]
  minRating?: number
  sort?: string
  currentPage: number
  totalPages: number
  searchParams: { [key: string]: string | undefined }
  showFavoritesOnly?: boolean
}

export function BookmarkList({ 
  bookmarks, 
  userFavorites, 
  totalCount,
  query = '',
  selectedTags = [],
  minRating = 0,
  sort = 'recent',
  currentPage,
  totalPages,
  searchParams,
  showFavoritesOnly = false
}: BookmarkListProps) {
  
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') params.set(key, value)
    })
    if (page > 1) params.set('page', String(page))
    const queryString = params.toString()
    return `/browse${queryString ? `?${queryString}` : ''}`
  }

  return (
    <div className="space-y-4">
      {/* Active Filters Bar */}
      <ActiveFiltersBar
        query={query}
        selectedTags={selectedTags}
        minRating={minRating}
        sort={sort}
        showFavoritesOnly={showFavoritesOnly}
      />
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {totalCount} bookmark{totalCount !== 1 ? 's' : ''}
          {totalPages > 1 && (
            <span className="text-gray-400"> · Page {currentPage} of {totalPages}</span>
          )}
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No bookmarks found matching your criteria.</p>
          <Link href="/browse" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
            Clear all filters
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {bookmarks.map((bookmark: any) => {
              const isFavorited = userFavorites.includes(bookmark.id)
              const ratings = bookmark.ratings || []
              const avgRating = ratings.length > 0
                ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
                : 0
              const tags = bookmark.bookmark_tags?.map((bt: any) => bt.tags).filter(Boolean) || []
              const userObj = Array.isArray(bookmark.users) ? bookmark.users[0] : bookmark.users

              return (
                <div
                  key={bookmark.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex gap-3">
                    {/* Favicon */}
                    <div className="shrink-0">
                      <BookmarkFavicon
                        faviconUrl={bookmark.favicon_url}
                        title={bookmark.title}
                        size="md"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/bookmark/${bookmark.id}`}
                              className="font-medium text-gray-900 hover:text-primary-600 truncate block"
                            >
                              {bookmark.title}
                            </Link>
                          </div>
                          <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-500 hover:text-gray-700 truncate flex items-center gap-1"
                          >
                            {new URL(bookmark.url).hostname}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>

                        {/* Favorite indicator */}
                        {isFavorited && (
                          <Heart className="h-4 w-4 fill-red-500 text-red-500 shrink-0" />
                        )}
                      </div>

                      {bookmark.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {bookmark.description}
                        </p>
                      )}

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tags.slice(0, 5).map((tag: any) => (
                            <Link
                              key={tag.id}
                              href={`/browse?tag=${encodeURIComponent(tag.name)}`}
                              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                            >
                              {tag.name}
                            </Link>
                          ))}
                          {tags.length > 5 && (
                            <span className="text-xs text-gray-400">+{tags.length - 5}</span>
                          )}
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {avgRating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {avgRating.toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {bookmark.click_count || 0}
                        </span>
                        {userObj?.name && (
                          <span>by {userObj.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Link
                href={buildPageUrl(currentPage - 1)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? 'text-gray-300 pointer-events-none'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first, last, current, and adjacent pages
                  const showPage = 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1
                  
                  const showEllipsis = 
                    (page === 2 && currentPage > 4) ||
                    (page === totalPages - 1 && currentPage < totalPages - 3)
                  
                  if (!showPage && !showEllipsis) return null
                  
                  if (showEllipsis && !showPage) {
                    return <span key={page} className="px-2 text-gray-400">...</span>
                  }
                  
                  return (
                    <Link
                      key={page}
                      href={buildPageUrl(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        page === currentPage
                          ? 'bg-primary-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </Link>
                  )
                })}
              </div>
              
              <Link
                href={buildPageUrl(currentPage + 1)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'text-gray-300 pointer-events-none'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
