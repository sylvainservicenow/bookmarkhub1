import { createAdminClient } from '@/lib/supabase/admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { BrowseHeader } from '@/components/browse/BrowseHeader'
import { FiltersSidebar } from '@/components/browse/FiltersSidebar'
import { BookmarkList } from '@/components/browse/BookmarkList'

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
  }>
}) {
  const params = await searchParams
  const query = params.q || ''
  const tag = params.tag || ''
  const tagsParam = params.tags || ''
  const sort = params.sort || 'recent'
  const minRating = params.rating ? parseInt(params.rating) : 0
  const currentPage = params.page ? parseInt(params.page) : 1
  
  // Parse multiple tags
  const selectedTags = tagsParam ? tagsParam.split(',').filter(Boolean) : (tag ? [tag] : [])
  
  const supabase = createAdminClient()
  const session = await getServerSession(authOptions)
  const user = session?.user
  
  // Get user's favorites
  let userFavorites: string[] = []
  if (user?.id) {
    const { data: favorites } = await supabase
      .from('favorites')
      .select('bookmark_id')
      .eq('user_id', user.id)
    userFavorites = favorites?.map(f => f.bookmark_id) || []
  }
  
  // Get all tags for filter
  const { data: allTags } = await supabase
    .from('tags')
    .select('id, name')
    .eq('status', 'active')
    .order('name')
  
  // Build bookmarks query - show public bookmarks + user's own private bookmarks
  let bookmarksQuery = supabase
    .from('bookmarks')
    .select(`
      *,
      users!bookmarks_creator_id_fkey(id, name),
      bookmark_tags(tag_id, tags(id, name)),
      ratings(rating)
    `)
    .eq('status', 'active')
  
  // Visibility filter: public OR own bookmarks
  if (user?.id) {
    bookmarksQuery = bookmarksQuery.or(`visibility.eq.public,creator_id.eq.${user.id}`)
  } else {
    bookmarksQuery = bookmarksQuery.eq('visibility', 'public')
  }
  
  // Text search
  if (query) {
    bookmarksQuery = bookmarksQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,url.ilike.%${query}%`)
  }
  
  // Sorting
  if (sort === 'popular') {
    bookmarksQuery = bookmarksQuery.order('click_count', { ascending: false })
  } else if (sort === 'discussed') {
    bookmarksQuery = bookmarksQuery.order('created_at', { ascending: false })
  } else {
    bookmarksQuery = bookmarksQuery.order('created_at', { ascending: false })
  }
  
  // Fetch more to allow for client-side filtering
  const { data: bookmarks } = await bookmarksQuery.limit(500)
  
  let filteredBookmarks = bookmarks || []
  
  // Filter by tags
  if (selectedTags.length > 0) {
    filteredBookmarks = filteredBookmarks.filter((b: any) => 
      selectedTags.some(selectedTag =>
        b.bookmark_tags?.some((bt: any) => 
          bt.tags?.name?.toLowerCase() === selectedTag.toLowerCase()
        )
      )
    )
  }
  
  // Filter by rating
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
  
  // Pagination
  const totalCount = filteredBookmarks.length
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedBookmarks = filteredBookmarks.slice(startIndex, startIndex + ITEMS_PER_PAGE)

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
            />
          </aside>
          
          {/* Main Content - Bookmark List */}
          <main className="lg:col-span-9">
            <BookmarkList
              bookmarks={paginatedBookmarks}
              userFavorites={userFavorites}
              totalCount={totalCount}
              query={query}
              selectedTags={selectedTags}
              minRating={minRating}
              sort={sort}
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={params}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
