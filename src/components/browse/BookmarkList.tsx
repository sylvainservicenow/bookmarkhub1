'use client'

import Link from 'next/link'
import { Star, MessageSquare, ExternalLink, Heart, Eye, FolderOpen, Lock } from 'lucide-react'
import { BookmarkFavicon } from '@/components/bookmarks/BookmarkFavicon'
import { AddToGroupButton } from '@/components/groups/AddToGroupButton'

interface BookmarkListProps {
  bookmarks: any[]
  userFavorites: string[]
  totalCount: number
  showAddToGroup?: boolean
}

export function BookmarkList({ bookmarks, userFavorites, totalCount, showAddToGroup }: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No bookmarks found matching your criteria.</p>
        <Link href="/browse" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
          Clear all filters
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{totalCount} bookmark{totalCount !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-3">
        {bookmarks.map((bookmark: any) => {
          const isFavorited = userFavorites.includes(bookmark.id)
          const ratings = bookmark.ratings || []
          const avgRating = ratings.length > 0
            ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
            : 0
          const tags = bookmark.bookmark_tags?.map((bt: any) => bt.tags).filter(Boolean) || []
          const groups = bookmark.bookmark_groups || []
          const isRestricted = bookmark.visibility === 'restricted'
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
                        {isRestricted && (
                          <span className="shrink-0 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            <Lock className="h-3 w-3" />
                            Restricted
                          </span>
                        )}
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
                    {showAddToGroup && bookmark.visibility === 'public' && (
                      <AddToGroupButton bookmarkId={bookmark.id} bookmarkTitle={bookmark.title} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
