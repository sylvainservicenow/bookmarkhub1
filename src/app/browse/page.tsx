import { createAdminClient } from '@/lib/supabase/admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { FiltersSidebar } from '@/components/browse/FiltersSidebar'
import { BookmarkList } from '@/components/browse/BookmarkList'
import { ActiveFiltersBar } from '@/components/browse/ActiveFiltersBar'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'

// REMOVED: export const dynamic = 'force-dynamic' - This was killing your Vercel bill!
// Instead we use ISR with revalidation + unstable_cache for expensive queries

export const revalidate = 300 // Revalidate every 5 minutes (public content)

export const metadata: Metadata = {
  title: 'Browse ServiceNow Bookmarks',
  description: 'Browse curated ServiceNow bookmarks by category, tag, or rating. Find documentation, tools, scripts, GitHub repos, and community resources for ServiceNow developers and admins.',
  keywords: ['ServiceNow bookmarks', 'ServiceNow documentation', 'ServiceNow tools', 'ServiceNow scripts', 'ServiceNow developer resources'],
  alternates: {
    canonical: 'https://www.mybookmarkhub.com/browse',
  },
  openGraph: {
    title: 'Browse ServiceNow Bookmarks | BookmarkHub',
    description: 'Discover curated ServiceNow resources - documentation, tools, scripts, and community content.',
    url: 'https://www.mybookmarkhub.com/browse',
    images: ['/og-image.png'],
  },
}

const ITEMS_PER_PAGE = 25

// Cache the tags query - this rarely changes and is called on every page view
const getCachedTags = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('tags')
      .select('id, name')
      .eq('status', 'active')
      .order('name')
    return data || []
  },
  ['all-tags'],
  { revalidate: 3600, tags: ['tags'] } // Cache for 1 hour
)

// Cache public bookmarks query (user-independent)
const getCachedPublicBookmarks = unstable_cache(
  async (
    query: string,
    selectedTags: string[],
    sort: string,
    offset: number,
    limit: number
  ) => {
    const supabase = createAdminClient()
    
    let bookmarksQuery = supabase
      .from('bookmarks')
      .select(`
        id,
        title,
        url,
        description,
        favicon_url,
        click_count,
        created_at,
        visibility,
        creator_id,
        users!bookmarks_creator_id_fkey(id, name),
        bookmark_tags(tag_id, tags(id, name)),
        ratings(rating)
      `, { count: 'exact' })
      .eq('status', 'active')
      .eq('visibility', 'public')
    
    // Text search
    if (query) {
      bookmarksQuery = bookmarksQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,url.ilike.%${query}%`)
    }
    
    // Sorting
    if (sort === 'popular') {
      bookmarksQuery = bookmarksQuery.order('click_count', { ascending: false })
    } else {
      bookmarksQuery = bookmarksQuery.order('created_at', { ascending: false })
    }
    
    // Pagination
    bookmarksQuery = bookmarksQuery.range(offset, offset + limit - 1)
    
    const { data, count } = await bookmarksQuery
    return { bookmarks: data || [], totalCount: count || 0 }
  },
  ['public-bookmarks'],
  { revalidate: 300, tags: ['bookmarks'] } // Cache for 5 minutes
)

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ 
    q?: string
    tag?: string
    tags?: string
    sort?: string
    rating?: string
    page?: string
    favorites?: string
    private?: string
  }>
}) {
  const params = await searchParams
  const query = params.q || ''
  const tag = params.tag || ''
  const tagsParam = params.tags || ''
  const sort = params.sort || 'recent'
  const minRating = params.rating ? parseInt(params.rating) : 0
  const currentPage = params.page ? parseInt(params.page) : 1
  const showFavoritesOnly = params.favorites === 'true'
  const showPrivateOnly = params.private === 'true'
  
  const selectedTags = tagsParam ? tagsParam.split(',').filter(Boolean) : (tag ? [tag] : [])
  
  const session = await getServerSession(authOptions)
  const user = session?.user
  
  const offset = (currentPage - 1) * ITEMS_PER_PAGE
  
  // Get cached tags (1 hour cache)
  const allTags = await getCachedTags()
  
  // For logged-out users or simple public queries, use cached results
  const isSimplePublicQuery = !user && !showFavoritesOnly && !showPrivateOnly && selectedTags.length === 0
  
  let bookmarks: any[] = []
  let totalCount = 0
  let userFavorites: string[] = []
  let privateBookmarksCount = 0
  
  if (isSimplePublicQuery) {
    // Use cached query for public browsing (most common case)
    const result = await getCachedPublicBookmarks(query, selectedTags, sort, offset, ITEMS_PER_PAGE)
    bookmarks = result.bookmarks
    totalCount = result.totalCount
  } else {
    // For authenticated users or complex queries, do live query
    const supabase = createAdminClient()
    
    // Get user's favorites (only if logged in)
    if (user?.id) {
      const { data: favorites } = await supabase
        .from('favorites')
        .select('bookmark_id')
        .eq('user_id', user.id)
      userFavorites = favorites?.map(f => f.bookmark_id) || []
    }
    
    // Get private count
    if (user?.id) {
      const { count } = await supabase
        .from('bookmarks')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('visibility', 'private')
        .eq('status', 'active')
      privateBookmarksCount = count || 0
    }
    
    // Build query for authenticated user
    let bookmarksQuery = supabase
      .from('bookmarks')
      .select(`
        id,
        title,
        url,
        description,
        favicon_url,
        click_count,
        created_at,
        visibility,
        creator_id,
        users!bookmarks_creator_id_fkey(id, name),
        bookmark_tags(tag_id, tags(id, name)),
        ratings(rating)
      `, { count: 'exact' })
      .eq('status', 'active')
    
    // Visibility filter
    if (showPrivateOnly && user?.id) {
      bookmarksQuery = bookmarksQuery
        .eq('creator_id', user.id)
        .eq('visibility', 'private')
    } else if (user?.id) {
      bookmarksQuery = bookmarksQuery.or(`visibility.eq.public,creator_id.eq.${user.id}`)
    } else {
      bookmarksQuery = bookmarksQuery.eq('visibility', 'public')
    }
    
    // Text search
    if (query) {
      bookmarksQuery = bookmarksQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,url.ilike.%${query}%`)
    }
    
    // Tag filtering
    if (selectedTags.length > 0) {
      // Get bookmark IDs that have these tags
      const { data: taggedBookmarks } = await supabase
        .from('bookmark_tags')
        .select('bookmark_id, tags!inner(name)')
        .in('tags.name', selectedTags)
      
      const bookmarkIds = [...new Set(taggedBookmarks?.map(t => t.bookmark_id) || [])]
      if (bookmarkIds.length > 0) {
        bookmarksQuery = bookmarksQuery.in('id', bookmarkIds)
      } else {
        // No matches, return empty
        bookmarks = []
        totalCount = 0
      }
    }
    
    // Favorites filter
    if (showFavoritesOnly && userFavorites.length > 0) {
      bookmarksQuery = bookmarksQuery.in('id', userFavorites)
    }
    
    // Sorting
    if (sort === 'popular') {
      bookmarksQuery = bookmarksQuery.order('click_count', { ascending: false })
    } else {
      bookmarksQuery = bookmarksQuery.order('created_at', { ascending: false })
    }
    
    // Pagination
    bookmarksQuery = bookmarksQuery.range(offset, offset + ITEMS_PER_PAGE - 1)
    
    const { data, count } = await bookmarksQuery
    bookmarks = data || []
    totalCount = count || 0
  }
  
  // Client-side rating filter (after fetch)
  let filteredBookmarks = bookmarks
  if (minRating > 0) {
    filteredBookmarks = filteredBookmarks.filter((b: any) => {
      const ratings = b.ratings || []
      if (ratings.length === 0) return false
      const avg = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
      return avg >= minRating
    })
  }
  
  // Sort by rating if requested
  if (sort === 'rated') {
    filteredBookmarks = filteredBookmarks.sort((a: any, b: any) => {
      const avgA = a.ratings?.length > 0 
        ? a.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / a.ratings.length 
        : 0
      const avgB = b.ratings?.length > 0 
        ? b.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / b.ratings.length 
        : 0
      return avgB - avgA
    })
  }
  
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <FiltersSidebar
              currentSort={sort}
              selectedTags={selectedTags}
              minRating={minRating}
              searchParams={params}
              allTags={allTags}
              isLoggedIn={!!user}
              showFavoritesOnly={showFavoritesOnly}
              favoritesCount={userFavorites.length}
              showPrivateOnly={showPrivateOnly}
              privateCount={privateBookmarksCount}
            />
          </aside>
          
          <main className="lg:col-span-9">
            <BookmarkList
              bookmarks={filteredBookmarks}
              userFavorites={userFavorites}
              totalCount={totalCount}
              query={query}
              selectedTags={selectedTags}
              minRating={minRating}
              sort={sort}
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={params}
              showFavoritesOnly={showFavoritesOnly}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
