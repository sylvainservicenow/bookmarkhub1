'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Plus } from 'lucide-react'

interface BrowseHeaderProps {
  initialQuery: string
}

export function BrowseHeader({ initialQuery }: BrowseHeaderProps) {
  const [query, setQuery] = useState(initialQuery)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Reset query when URL changes (e.g., after navigation completes)
  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(window.location.search)
    if (query.trim()) {
      params.set('q', query.trim())
    } else {
      params.delete('q')
    }
    // Reset to page 1 on new search
    params.delete('page')
    router.push(`/browse?${params.toString()}`)
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo/Title */}
          <div>
            <Link href="/" className="text-xl font-bold text-gray-900">
              BookmarkHub
            </Link>
            <p className="text-sm text-gray-500">Discover and organize amazing resources</p>
          </div>
          
          {/* Search */}
          <form onSubmit={handleSubmit} className="flex-1 max-w-xl">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search bookmarks, tags, or groups..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white outline-none transition-all text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
              >
                Search
              </button>
            </div>
          </form>
          
          {/* Add Bookmark Button */}
          <Link
            href="/submit"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Bookmark
          </Link>
        </div>
      </div>
    </header>
  )
}
