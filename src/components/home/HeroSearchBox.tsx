'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { homepageConfig } from '@/config/homepage'

export function HeroSearchBox() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  
  const { searchPlaceholder, searchButtonText } = homepageConfig.hero

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    if (query.trim()) {
      router.push(`/browse?q=${encodeURIComponent(query.trim())}`)
    } else {
      router.push('/browse')
    }
  }

  // Show loading state while navigating
  if (isSearching) {
    return (
      <div className="max-w-2xl mx-auto mb-10">
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
          <span className="text-gray-600">Searching bookmarks...</span>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-10">
      <div className="relative">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-14 pr-28 py-4 text-lg bg-white border border-gray-200 rounded-full shadow-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors font-medium text-sm"
        >
          {searchButtonText}
        </button>
      </div>
    </form>
  )
}
