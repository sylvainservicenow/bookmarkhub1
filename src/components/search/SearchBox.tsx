'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function SearchBox() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bookmarks..."
          className="w-full px-6 py-4 text-lg border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>
    </form>
  )
}
