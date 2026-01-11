'use client'

import { useRouter } from 'next/navigation'
import { Filter, Star, Users } from 'lucide-react'

interface FiltersSidebarProps {
  currentSort: string
  selectedTags: string[]
  minRating: number
  groups: { id: string; name: string }[]
  searchParams: Record<string, string | undefined>
  topContributors: { id: string; name: string; count: number }[]
}

export function FiltersSidebar({
  currentSort,
  selectedTags,
  minRating,
  groups,
  searchParams,
  topContributors,
}: FiltersSidebarProps) {
  const router = useRouter()
  
  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== key) params.set(k, v)
    })
    if (value) params.set(key, value)
    router.push(`/browse?${params.toString()}`)
  }

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'rated', label: 'Top Rated' },
    { value: 'discussed', label: 'Most Discussed' },
  ]

  const ratingOptions = [
    { value: 5, label: '5 stars' },
    { value: 4, label: '4 stars & up' },
    { value: 3, label: '3 stars & up' },
  ]

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        
        {/* Sort By */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Sort By</h4>
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  checked={currentSort === option.value}
                  onChange={() => updateParams('sort', option.value)}
                  className="w-4 h-4 text-primary-500 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Groups */}
        {groups.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-gray-400" />
              <h4 className="text-sm font-medium text-gray-700">Groups</h4>
            </div>
            <div className="space-y-2">
              {groups.slice(0, 5).map((group) => (
                <label key={group.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600">{group.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        {/* Rating */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-gray-400" />
            <h4 className="text-sm font-medium text-gray-700">Rating</h4>
          </div>
          <div className="space-y-2">
            {ratingOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={minRating === option.value}
                  onChange={() => updateParams('rating', minRating === option.value ? null : option.value.toString())}
                  className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= option.value
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">& up</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      {/* Top Contributors Card */}
      {topContributors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUpIcon className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Top Contributors</h3>
          </div>
          <div className="space-y-3">
            {topContributors.map((contributor, index) => (
              <div key={contributor.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700">
                    {contributor.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{contributor.name}</div>
                    <div className="text-xs text-gray-500">{contributor.count} bookmarks</div>
                  </div>
                </div>
                <div className={`
                  px-2 py-0.5 rounded text-xs font-medium
                  ${index === 0 ? 'bg-amber-100 text-amber-700' : ''}
                  ${index === 1 ? 'bg-gray-100 text-gray-700' : ''}
                  ${index === 2 ? 'bg-orange-100 text-orange-700' : ''}
                  ${index > 2 ? 'bg-gray-50 text-gray-500' : ''}
                `}>
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}
