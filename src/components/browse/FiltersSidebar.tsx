'use client'

import Link from 'next/link'
import { Clock, TrendingUp, Star, MessageSquare, User } from 'lucide-react'

interface FiltersSidebarProps {
  currentSort: string
  selectedTags: string[]
  minRating: number
  searchParams: { [key: string]: string | undefined }
  topContributors: { id: string; name: string; count: number }[]
}

export function FiltersSidebar({ 
  currentSort, 
  selectedTags, 
  minRating,
  searchParams,
  topContributors 
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
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    return `/browse?${params.toString()}`
  }

  return (
    <div className="space-y-6">
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

      {/* Top Contributors */}
      {topContributors.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Top Contributors</h3>
          <div className="space-y-2">
            {topContributors.map((contributor, index) => (
              <div
                key={contributor.id}
                className="flex items-center gap-2 text-sm"
              >
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
                <User className="h-3 w-3 text-gray-400" />
                <span className="text-gray-700 truncate flex-1">{contributor.name}</span>
                <span className="text-gray-400 text-xs">{contributor.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
