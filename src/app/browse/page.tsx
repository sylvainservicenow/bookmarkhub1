import { createAdminClient } from '@/lib/supabase/admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { BrowseHeader } from '@/components/browse/BrowseHeader'
import { FiltersSidebar } from '@/components/browse/FiltersSidebar'
import { BookmarkList } from '@/components/browse/BookmarkList'
import type { Metadata } from 'next'

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Browse ServiceNow Bookmarks',
  description: 'Browse curated ServiceNow bookmarks by category, tag, or rating. Find documentation, tools, scripts, GitHub repos, and community resources for ServiceNow developers and admins.',
  keywords: ['ServiceNow bookmarks', 'ServiceNow documentation', 'ServiceNow tools', 'ServiceNow scripts', 'ServiceNow developer resources'],
  openGraph: {
    title: 'Browse ServiceNow Bookmarks | BookmarkHub',
    description: 'Discover curated ServiceNow resources - documentation, tools, scripts, and community content.',
    url: 'https://www.mybookmarkhub.com/browse',
  },
}

const ITEMS_PER_PAGE = 25

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
  
  // Parse multiple tags
  const selectedTags = tagsParam ? tagsParam.split(',').filter(Boolean) : (tag ? [tag] : [])
  
  const supabase = createAdminClient()
  const session = await getServerSession(authOptions)
  const user = session?.user
  
  // Get user's favorites (only IDs, minimal data)
  let userFavorites: string[] = []
  if (user?.id) {
    const { data: favorites } = await supabase
      .from('favorites')
      .select('bookmark_id')
      .eq('user_id', user.id)
    userFavorites = favorites?.map(f => f.bookmark_id) || []
  }
  
  // Get user's private bookmarks count (head: true = no data transfer)
  let privateBookmarksCount = 0
  if (user?.id) {
    const { count } = await supabase
      .from('bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', user.id)
      .eq('visibility', 'private')
      .eq('status', 'active')
    privateBookmarksCount = count || 0
  }
  
  // Get all tags for filter (only id and name)
  const { data: allTags } = await supabase
    .from('tags')
    .select('id, name')
    .eq('status', 'active')
    .order('name')
  
  // Calculate offset for pagination
  const offset = (currentPage - 1) * ITEMS_PER_PAGE
  
  // Build optimized bookmarks query - only fetch needed columns
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
      bookmark_tags!inner(tag_id, tags(id, name)),
      ratings(rating)
    `, { count: 'exact' })
    .eq('status', 'active')
  
  // For queries without tag filter, we need left join behavior
  if (selectedTags.length === 0) {
    bookmarksQuery = supabase
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
  }
  
  // Visibility filter: depends on whether showing private only
  if (showPrivateOnly && user?.id) {
    // Show only user's private bookmarks
    bookmarksQuery = bookmarksQuery
      .eq('creator_id', user.id)
      .eq('visibility', 'private')
  } else if (user?.id) {
    // Normal mode: public OR own bookmarks
    bookmarksQuery = bookmarksQuery.or(`visibility.eq.public,creator_id.eq.${user.id}`)
  } else {
    bookmarksQuery = bookmarksQuery.eq('visibility', 'public')
  }
  
  // Text search - server side
  if (query) {
    bookmarksQuery = bookmarksQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,url.ilike.%${query}%`)
  }
  
  // Tag filtering - server side via inner join
  if (selectedTags.length > 0) {
    // The inner join on bookmark_tags already filters, but we need to match tag names
    bookmarksQuery = bookmarksQuery.in('bookmark_tags.tags.name', selectedTags)
  }
  
  // Filter by favorites - server side
  if (showFavoritesOnly && userFavorites.length > 0) {
    bookmarksQuery = bookmarksQuery.in('id', userFavorites)
  }
  
  // Sorting
  if (sort === 'popular') {
    bookmarksQuery = bookmarksQuery.order('click_count', { ascending: false })
  } else if (sort === 'rated') {
    // For rated sort, we'll sort client-side after fetching (need aggregation)
    bookmarksQuery = bookmarksQuery.order('created_at', { ascending: false })
  } else {
    // 'recent' or 'discussed' - both use created_at for now
    bookmarksQuery = bookmarksQuery.order('created_at', { ascending: false })
  }
  
  // Server-side pagination - only fetch what we need!
  bookmarksQuery = bookmarksQuery.range(offset, offset + ITEMS_PER_PAGE - 1)
  
  const { data: bookmarks, count: totalCount } = await bookmarksQuery
  
  let filteredBookmarks = bookmarks || []
  
  // Filter by rating (needs to be done after fetch since it requires aggregation)
  if (minRating > 0) {
    filteredBookmarks = filteredBookmarks.filter((b: any) => {
      const ratings = b.ratings || []
      if (ratings.length === 0) return false
      const avg = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
      return avg >= minRating
    })
  }
  
  // Sort by rating if requested (after fetch since it requires aggregation)
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
  
  // Calculate pagination info
  const finalTotalCount = totalCount || 0
  const totalPages = Math.ceil(finalTotalCount / ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with search */}
      <BrowseHeader initialQuery={query} />
      
      {/* Main 2-column layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="lg:col-span-3">
            <FiltersSidebar
              currentSort={sort}
              selectedTags={selectedTags}
              minRating={minRating}
              searchParams={params}
              allTags={allTags || []}
              isLoggedIn={!!user}
              showFavoritesOnly={showFavoritesOnly}
              favoritesCount={userFavorites.length}
              showPrivateOnly={showPrivateOnly}
              privateCount={privateBookmarksCount}
            />
          </aside>
          
          {/* Main Content - Bookmark List */}
          <main className="lg:col-span-9">
            <BookmarkList
              bookmarks={filteredBookmarks}
              userFavorites={userFavorites}
              totalCount={finalTotalCount}
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
