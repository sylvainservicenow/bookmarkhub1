'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

export function HeaderSearchBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check if we're on the homepage
  const isHomepage = pathname === '/'
  
  // Sync search query with URL params when on browse page
  useEffect(() => {
    if (pathname === '/browse') {
      setSearchQuery(searchParams.get('q') || '')
    }
  }, [pathname, searchParams])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim())
    }
    router.push(`/browse?${params.toString()}`)
  }
  
  // Don't render on homepage
  if (isHomepage) {
    return null
  }

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-xl">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search bookmarks..."
          className="w-full pl-10 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white outline-none transition-all text-sm"
        />
        <button
          type="submit"
          className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}
