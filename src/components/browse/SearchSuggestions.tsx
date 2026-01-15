'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Tag, Bookmark } from 'lucide-react'

interface Suggestion {
  text: string
  source: 'tag' | 'bookmark'
  score: number
}

interface SearchSuggestionsProps {
  query: string
  hasResults: boolean
}

export function SearchSuggestions({ query, hasResults }: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Only fetch suggestions when there are no results and we have a query
    if (hasResults || !query || query.length < 2) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    // Debounce the request
    const timeoutId = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timeoutId)
  }, [query, hasResults])

  // Don't render anything if we have results or no suggestions
  if (hasResults || suggestions.length === 0) {
    return null
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 text-amber-800 mb-2">
        <Search className="h-4 w-4" />
        <span className="font-medium">Did you mean:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.source === 'tag' ? Tag : Bookmark
          const searchUrl = suggestion.source === 'tag'
            ? `/browse?tag=${encodeURIComponent(suggestion.text)}`
            : `/browse?q=${encodeURIComponent(suggestion.text)}`

          return (
            <Link
              key={`${suggestion.text}-${index}`}
              href={searchUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-full text-sm text-amber-900 hover:bg-amber-100 hover:border-amber-400 transition-colors"
            >
              <Icon className="h-3.5 w-3.5" />
              {suggestion.text}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
