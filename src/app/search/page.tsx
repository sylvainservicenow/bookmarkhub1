import { createClient } from '@/lib/supabase/server'
import { SearchBox } from '@/components/search/SearchBox'
import { BookmarkCard } from '@/components/bookmarks/BookmarkCard'
import { SearchFilters } from '@/components/search/SearchFilters'
import Link from 'next/link'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    q?: string
    tag?: string
    domain?: string
    sort?: string
    visibility?: string
  }>
}) {
  const params = await searchParams
  const query = params.q || ''
  const tag = params.tag || ''
  const domain = params.domain || ''
  const sort = params.sort || 'recent'
  const visibility = params.visibility || 'all'
  
  const supabase = await createClient()
  
  // Get current user for favorites
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user's favorites
  let userFavorites: string[] = []
  if (user) {
    const { data: favorites } = await supabase
      .from('favorites')
      .select('bookmark_id')
      .eq('user_id', user.id)
    userFavorites = favorites?.map(f => f.bookmark_id) || []
  }
  
  // Get all tags for filter dropdown
  const { data: allTags } = await supabase
    .from('tags')
    .select('id, name')
    .eq('status', 'active')
    .order('name')
  
  let bookmarks: any[] = []
  
  // Build base query
  let bookmarksQuery = supabase
    .from('bookmarks')
    .select(`
      *,
      bookmark_tags(tag_id, tags(id, name)),
      ratings(rating)
    `)
    .eq('status', 'active')
  
  // Visibility filter
  if (visibility === 'public') {
    bookmarksQuery = bookmarksQuery.eq('visibility', 'public')
  } else if (visibility === 'private' && user) {
    bookmarksQuery = bookmarksQuery.eq('visibility', 'private').eq('creator_id', user.id)
  } else {
    // Default: show only public bookmarks
    bookmarksQuery = bookmarksQuery.eq('visibility', 'public')
  }
  
  // Text search
  if (query) {
    bookmarksQuery = bookmarksQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,url.ilike.%${query}%`)
  }
  
  // Domain filter
  if (domain) {
    bookmarksQuery = bookmarksQuery.ilike('url', `%${domain}%`)
  }
  
  // Sorting
  if (sort === 'popular') {
    bookmarksQuery = bookmarksQuery.order('click_count', { ascending: false })
  } else if (sort === 'rated') {
    // We'll sort by rating after fetching
    bookmarksQuery = bookmarksQuery.order('created_at', { ascending: false })
  } else {
    // Default: recent
    bookmarksQuery = bookmarksQuery.order('created_at', { ascending: false })
  }
  
  const { data, error } = await bookmarksQuery.limit(50)
  
  if (error) {
    console.error('Search error:', error)
  }
  
  bookmarks = data || []
  
  // Filter by tag if specified (post-query since nested filter is tricky)
  if (tag) {
    bookmarks = bookmarks.filter((b: any) => 
      b.bookmark_tags?.some((bt: any) => 
        bt.tags?.name?.toLowerCase() === tag.toLowerCase()
      )
    )
  }
  
  // Sort by rating if requested
  if (sort === 'rated') {
    bookmarks = bookmarks.sort((a: any, b: any) => {
      const avgA = a.ratings?.length > 0 
        ? a.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / a.ratings.length 
        : 0
      const avgB = b.ratings?.length > 0 
        ? b.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / b.ratings.length 
        : 0
      return avgB - avgA
    })
  }

  // Build active filters for display
  const activeFilters: { label: string; removeUrl: string }[] = []
  const baseUrl = '/search'
  
  if (query) {
    const newParams = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v && k !== 'q') newParams.set(k, v) })
    activeFilters.push({ 
      label: `"${query}"`, 
      removeUrl: `${baseUrl}?${newParams.toString()}` 
    })
  }
  if (tag) {
    const newParams = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v && k !== 'tag') newParams.set(k, v) })
    activeFilters.push({ 
      label: `Tag: ${tag}`, 
      removeUrl: `${baseUrl}?${newParams.toString()}` 
    })
  }
  if (domain) {
    const newParams = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v && k !== 'domain') newParams.set(k, v) })
    activeFilters.push({ 
      label: `Domain: ${domain}`, 
      removeUrl: `${baseUrl}?${newParams.toString()}` 
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Search Box */}
      <div className="mb-6">
        <SearchBox initialQuery={query} />
      </div>
      
      {/* Filters */}
      <SearchFilters 
        currentSort={sort}
        currentTag={tag}
        currentVisibility={visibility}
        tags={allTags || []}
        searchParams={params}
      />
      
      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map((filter, idx) => (
            <Link
              key={idx}
              href={filter.removeUrl}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full hover:bg-primary-200"
            >
              {filter.label}
              <span className="ml-1">×</span>
            </Link>
          ))}
          {activeFilters.length > 1 && (
            <Link
              href="/search"
              className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200"
            >
              Clear all
            </Link>
          )}
        </div>
      )}
      
      {/* Results count */}
      <p className="text-gray-600 mb-6">
        {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} found
      </p>

      {/* Results */}
      <div className="grid gap-4">
        {bookmarks.length > 0 ? (
          bookmarks.map((bookmark: any) => (
            <BookmarkCard 
              key={bookmark.id} 
              bookmark={bookmark}
              isFavorited={userFavorites.includes(bookmark.id)}
              showFavorite={!!user}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            No bookmarks found. Try adjusting your filters.
          </div>
        )}
      </div>
    </div>
  )
}
