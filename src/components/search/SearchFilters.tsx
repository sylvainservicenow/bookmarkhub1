'use client'

import { useRouter } from 'next/navigation'
import { TrendingUp, Clock, Star, Filter } from 'lucide-react'

interface SearchFiltersProps {
  currentSort: string
  currentTag: string
  currentVisibility: string
  tags: { id: string; name: string }[]
  searchParams: Record<string, string | undefined>
}

export function SearchFilters({ 
  currentSort, 
  currentTag, 
  currentVisibility,
  tags,
  searchParams 
}: SearchFiltersProps) {
  const router = useRouter()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams()
    
    // Preserve existing params
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== key) params.set(k, v)
    })
    
    // Set new value (or remove if empty/default)
    if (value && value !== 'recent' && value !== 'all') {
      params.set(key, value)
    }
    
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4 text-gray-700">
        <Filter className="h-4 w-4" />
        <span className="font-medium">Filters</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Sort by
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateFilter('sort', 'recent')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                currentSort === 'recent' 
                  ? 'bg-primary-100 text-primary-700 font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Recent
            </button>
            <button
              onClick={() => updateFilter('sort', 'popular')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                currentSort === 'popular' 
                  ? 'bg-primary-100 text-primary-700 font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Popular
            </button>
            <button
              onClick={() => updateFilter('sort', 'rated')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                currentSort === 'rated' 
                  ? 'bg-primary-100 text-primary-700 font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Star className="h-3.5 w-3.5" />
              Top Rated
            </button>
          </div>
        </div>
        
        {/* Tag filter */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Tag
          </label>
          <select
            value={currentTag}
            onChange={(e) => updateFilter('tag', e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Visibility filter */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Visibility
          </label>
          <select
            value={currentVisibility}
            onChange={(e) => updateFilter('visibility', e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="all">All</option>
            <option value="public">Public only</option>
            <option value="private">My private</option>
          </select>
        </div>
      </div>
    </div>
  )
}
