'use client'

import Link from 'next/link'
import { X, Search, Tag, Star, Heart } from 'lucide-react'

interface ActiveFiltersBarProps {
  query?: string
  selectedTags: string[]
  minRating: number
  sort: string
  showFavoritesOnly?: boolean
}

export function ActiveFiltersBar({ query, selectedTags, minRating, sort, showFavoritesOnly }: ActiveFiltersBarProps) {
  const hasFilters = query || selectedTags.length > 0 || minRating > 0 || showFavoritesOnly

  if (!hasFilters) {
    return null
  }

  const buildClearUrl = (removeParam: string, removeValue?: string) => {
    const params = new URLSearchParams()
    if (sort && sort !== 'recent') params.set('sort', sort)
    
    if (removeParam !== 'q' && query) {
      params.set('q', query)
    }
    
    if (removeParam !== 'tags') {
      const remainingTags = selectedTags.filter(t => t !== removeValue)
      if (remainingTags.length > 0) {
        params.set('tags', remainingTags.join(','))
      }
    } else if (removeValue) {
      const remainingTags = selectedTags.filter(t => t !== removeValue)
      if (remainingTags.length > 0) {
        params.set('tags', remainingTags.join(','))
      }
    }
    
    if (removeParam !== 'rating' && minRating > 0) {
      params.set('rating', String(minRating))
    }
    
    if (removeParam !== 'favorites' && showFavoritesOnly) {
      params.set('favorites', 'true')
    }
    
    const queryString = params.toString()
    return `/browse${queryString ? `?${queryString}` : ''}`
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-gray-700">Active Filters</span>
        <Link
          href="/browse"
          className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
        >
          Clear all
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {showFavoritesOnly && (
          <Link
            href={buildClearUrl('favorites')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-sm hover:bg-red-100 transition-colors group"
          >
            <Heart className="h-3 w-3 fill-current" />
            <span>My Favorites</span>
            <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
          </Link>
        )}
        
        {query && (
          <Link
            href={buildClearUrl('q')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors group"
          >
            <Search className="h-3 w-3" />
            <span className="max-w-32 truncate">"{query}"</span>
            <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
          </Link>
        )}
        
        {selectedTags.map(tag => (
          <Link
            key={tag}
            href={buildClearUrl('tags', tag)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-sm hover:bg-teal-100 transition-colors group"
          >
            <Tag className="h-3 w-3" />
            <span>{tag}</span>
            <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
          </Link>
        ))}
        
        {minRating > 0 && (
          <Link
            href={buildClearUrl('rating')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-sm hover:bg-amber-100 transition-colors group"
          >
            <Star className="h-3 w-3 fill-current" />
            <span>{minRating}+ stars</span>
            <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
          </Link>
        )}
      </div>
    </div>
  )
}
