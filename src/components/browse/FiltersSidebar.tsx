'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Clock, TrendingUp, Star, MessageSquare, X } from 'lucide-react'

interface FiltersSidebarProps {
  currentSort: string
  selectedTags: string[]
  minRating: number
  searchParams: any
  topContributors: { id: string; name: string; count: number }[]
}

export function FiltersSidebar({ 
  currentSort, 
  selectedTags, 
  minRating, 
  searchParams,
  topContributors 
}: FiltersSidebarProps) {
  const router = useRouter()
  const params = useSearchParams()

  const sortOptions = [
    { value: 'recent', label: 'Most Recent', icon: Clock },
    { value: 'popular', label: 'Most Popular', icon: TrendingUp },
    { value: 'rated', label: 'Highest Rated', icon: Star },
    { value: 'discussed', label: 'Most Discussed', icon: MessageSquare },
  ]

  const buildUrl = (newParams: Record<string, string | undefined>) => {
    const current = new URLSearchParams(params.toString())
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        current.delete(key)
      } else {
        current.set(key, value)
      }
    })
    return `/browse?${current.toString()}`
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(t => t !== tagToRemove)
    router.push(buildUrl({ tags: newTags.join(',') || undefined, tag: undefined }))
  }

  const clearAllFilters = () => {
    router.push('/browse')
  }

  const hasFilters = selectedTags.length > 0 || minRating > 0

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {hasFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Active Filters</h3>
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-primary-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                {minRating}+ stars
                <button onClick={() => router.push(buildUrl({ rating: undefined }))} className="hover:text-amber-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">Sort By</h3>
        <div className="space-y-1">
          {sortOptions.map(option => {
            const Icon = option.icon
            const isActive = currentSort === option.value
            return (
              <Link
                key={option.value}
                href={buildUrl({ sort: option.value })}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
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
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">Minimum Rating</h3>
        <div className="space-y-1">
          {[0, 3, 4, 5].map(rating => (
            <Link
              key={rating}
              href={buildUrl({ rating: rating > 0 ? rating.toString() : undefined })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                minRating === rating
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {rating === 0 ? (
                'Any rating'
              ) : (
                <>
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span>& up</span>
                </>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Top Contributors */}
      {topContributors.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Top Contributors</h3>
          <div className="space-y-2">
            {topContributors.map((contributor, index) => (
              <div key={contributor.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4">{index + 1}.</span>
                <span className="text-sm text-gray-700 flex-1 truncate">{contributor.name}</span>
                <span className="text-xs text-gray-500">{contributor.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
