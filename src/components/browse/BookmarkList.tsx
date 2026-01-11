import { BrowseBookmarkCard } from './BrowseBookmarkCard'

interface BookmarkListProps {
  bookmarks: any[]
  userFavorites: string[]
  totalCount: number
}

export function BookmarkList({ bookmarks, userFavorites, totalCount }: BookmarkListProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Bookmarks</h2>
        <span className="text-sm text-gray-500">{totalCount} results</span>
      </div>
      
      {/* Bookmark Cards */}
      <div className="space-y-4">
        {bookmarks.length > 0 ? (
          bookmarks.map((bookmark: any) => (
            <BrowseBookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              isFavorited={userFavorites.includes(bookmark.id)}
            />
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No bookmarks found</p>
          </div>
        )}
      </div>
    </div>
  )
}
