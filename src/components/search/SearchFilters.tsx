'use client'

import { useRouter } from 'next/navigation'
import { TrendingUp, Clock, Star, Filter, X } from 'lucide-react'

interface SearchFiltersProps {
  currentSort: string
  selectedTags: string[]
  currentVisibility: string
  tags: { id: string; name: string }[]
  searchParams: Record<string, string | undefined>
}

export function SearchFilters({ 
  currentSort, 
  selectedTags, 
  currentVisibility,
  tags,
  searchParams 
}: SearchFiltersProps) {
  const router = useRouter()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams()
    
    // Preserve existing params
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== key && k !== 'tag') params.set(k, v)
    })
    
    // Set new value (or remove if empty/default)
    if (value && value !== 'recent' && value !== 'all') {
      params.set(key, value)
    }
    
    router.push(`/search?${params.toString()}`)
  }

  const toggleTag = (tagName: string) => {
    const params = new URLSearchParams()
    
    // Preserve existing params except tags
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== 'tag' && k !== 'tags') params.set(k, v)
    })
    
    let newTags: string[]
    if (selectedTags.includes(tagName)) {
      newTags = selectedTags.filter(t => t !== tagName)
    } else {
      newTags = [...selectedTags, tagName]
    }
    
    if (newTags.length > 0) {
      params.set('tags', newTags.join(','))
    }
    
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4 text-gray-700">
        <Filter className="h-4 w-4" />
        <span className="font-medium">Filters</span>
      </div>
      
      <div className="space-y-4">
        {/* Sort and Visibility row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
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
          
          {/* Visibility filter */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Visibility
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter('visibility', 'all')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  currentVisibility === 'all' 
                    ? 'bg-primary-100 text-primary-700 font-medium' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => updateFilter('visibility', 'public')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  currentVisibility === 'public' 
                    ? 'bg-primary-100 text-primary-700 font-medium' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Public
              </button>
              <button
                onClick={() => updateFilter('visibility', 'private')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  currentVisibility === 'private' 
                    ? 'bg-primary-100 text-primary-700 font-medium' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Only Mine
              </button>
            </div>
          </div>
        </div>
        
        {/* Tags - Multi-select */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Tags {selectedTags.length > 0 && `(${selectedTags.length} selected)`}
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.name)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.name)}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                  {isSelected && <X className="h-3 w-3" />}
                </button>
              )
            })}
            {tags.length === 0 && (
              <span className="text-gray-400 text-sm">No tags available</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
