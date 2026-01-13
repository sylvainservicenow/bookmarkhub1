'use client'

import Link from 'next/link'
import { Clock, TrendingUp, Star, MessageSquare, Tag, Check, Heart } from 'lucide-react'

interface FiltersSidebarProps {
  currentSort: string
  selectedTags: string[]
  minRating: number
  searchParams: { [key: string]: string | undefined }
  allTags: { id: string; name: string }[]
  isLoggedIn: boolean
  showFavoritesOnly: boolean
  favoritesCount: number
}

export function FiltersSidebar({ 
  currentSort, 
  selectedTags, 
  minRating,
  searchParams,
  allTags,
  isLoggedIn,
  showFavoritesOnly,
  favoritesCount
}: FiltersSidebarProps) {
  const sortOptions = [
    { id: 'recent', label: 'Most Recent', icon: Clock },
    { id: 'popular', label: 'Most Popular', icon: TrendingUp },
    { id: 'rated', label: 'Top Rated', icon: Star },
    { id: 'discussed', label: 'Most Discussed', icon: MessageSquare },
  ]

  const buildUrl = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const merged = { ...searchParams, ...newParams }
    // Reset page when changing filters
    delete merged.page
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    return `/browse?${params.toString()}`
  }

  const toggleTag = (tagName: string) => {
    const currentTags = [...selectedTags]
    const index = currentTags.findIndex(t => t.toLowerCase() === tagName.toLowerCase())
    
    if (index >= 0) {
      currentTags.splice(index, 1)
    } else {
      currentTags.push(tagName)
    }
    
    return buildUrl({ 
      tags: currentTags.length > 0 ? currentTags.join(',') : undefined,
      tag: undefined // Clear single tag param
    })
  }

  const isTagSelected = (tagName: string) => 
    selectedTags.some(t => t.toLowerCase() === tagName.toLowerCase())

  return (
    <div className="space-y-6">
      {/* My Favorites Filter - Only show if logged in */}
      {isLoggedIn && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4" />
            My Favorites
          </h3>
          <Link
            href={buildUrl({ favorites: showFavoritesOnly ? undefined : 'true' })}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              showFavoritesOnly
                ? 'bg-red-50 text-red-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
              showFavoritesOnly 
                ? 'bg-red-500 border-red-500' 
                : 'border-gray-300'
            }`}>
              {showFavoritesOnly && <Check className="h-3 w-3 text-white" />}
            </div>
            <span>Show only favorites</span>
            <span className="ml-auto text-xs text-gray-400">({favoritesCount})</span>
          </Link>
        </div>
      )}

      {/* Sort Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Sort By</h3>
        <div className="space-y-1">
          {sortOptions.map((option) => {
            const Icon = option.icon
            const isActive = currentSort === option.id
            return (
              <Link
                key={option.id}
                href={buildUrl({ sort: option.id })}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Rating Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Minimum Rating</h3>
        <div className="space-y-1">
          {[0, 3, 4, 5].map((rating) => (
            <Link
              key={rating}
              href={buildUrl({ rating: rating > 0 ? String(rating) : undefined })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                minRating === rating
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {rating === 0 ? (
                'All ratings'
              ) : (
                <>
                  <span className="text-amber-500">{'★'.repeat(rating)}</span>
                  <span>& up</span>
                </>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Filter by Tags
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {allTags.map((tag) => {
              const isSelected = isTagSelected(tag.name)
              return (
                <Link
                  key={tag.id}
                  href={toggleTag(tag.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isSelected
                      ? 'bg-teal-50 text-teal-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isSelected 
                      ? 'bg-teal-500 border-teal-500' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="truncate">{tag.name}</span>
                </Link>
              )
            })}
          </div>
          {selectedTags.length > 0 && (
            <Link
              href={buildUrl({ tags: undefined, tag: undefined })}
              className="block mt-3 text-xs text-center text-primary-600 hover:text-primary-700"
            >
              Clear tag filters
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
