import { createAdminClient } from '@/lib/supabase/admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { BrowseHeader } from '@/components/browse/BrowseHeader'
import { FiltersSidebar } from '@/components/browse/FiltersSidebar'
import { BookmarkList } from '@/components/browse/BookmarkList'
import { ActivitySidebar } from '@/components/browse/ActivitySidebar'

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ 
    q?: string
    tag?: string
    tags?: string
    group?: string
    sort?: string
    rating?: string
  }>
}) {
  const params = await searchParams
  const query = params.q || ''
  const tag = params.tag || ''
  const tagsParam = params.tags || ''
  const group = params.group || ''
  const sort = params.sort || 'recent'
  const minRating = params.rating ? parseInt(params.rating) : 0
  
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
  
  // Get all groups for filter
  const { data: allGroups } = await supabase
    .from('groups')
    .select('id, name')
    .eq('status', 'active')
    .order('name')
  
  // Build bookmarks query
  let bookmarksQuery = supabase
    .from('bookmarks')
    .select(`
      *,
      users!bookmarks_creator_id_fkey(id, name),
      bookmark_tags(tag_id, tags(id, name)),
      ratings(rating)
    `)
    .eq('status', 'active')
    .eq('visibility', 'public')
  
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
  
  const { data: bookmarks } = await bookmarksQuery.limit(50)
  
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
  
  // Get recent activity
  const { data: recentActivityData } = await supabase
    .from('bookmarks')
    .select(`
      id,
      title,
      created_at,
      users!bookmarks_creator_id_fkey(id, name)
    `)
    .eq('status', 'active')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(8)
  
  // Transform to handle array/object from Supabase
  const recentActivity = (recentActivityData as any[] || []).map((item) => ({
    id: item.id as string,
    title: item.title as string,
    created_at: item.created_at as string,
    users: item.users
  }))
  
  // Get top contributors
  const { data: contributors } = await supabase
    .from('bookmarks')
    .select('creator_id, users!bookmarks_creator_id_fkey(id, name)')
    .eq('status', 'active')
    .eq('visibility', 'public')
  
  // Count bookmarks per user
  const contributorCounts: Record<string, { id: string; name: string; count: number }> = {}
  contributors?.forEach((b: any) => {
    const userObj = Array.isArray(b.users) ? b.users[0] : b.users
    if (userObj?.id) {
      if (!contributorCounts[userObj.id]) {
        contributorCounts[userObj.id] = { id: userObj.id, name: userObj.name || 'Anonymous', count: 0 }
      }
      contributorCounts[userObj.id].count++
    }
  })
  
  const topContributors = Object.values(contributorCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  // Get popular tags
  const { data: tagCounts } = await supabase
    .from('bookmark_tags')
    .select('tags(name)')
  
  const tagCountMap: Record<string, number> = {}
  tagCounts?.forEach((t: any) => {
    if (t.tags?.name) {
      tagCountMap[t.tags.name] = (tagCountMap[t.tags.name] || 0) + 1
    }
  })
  
  const popularTags = Object.entries(tagCountMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name]) => name)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with search */}
      <BrowseHeader initialQuery={query} />
      
      {/* Main 3-column layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="lg:col-span-3">
            <FiltersSidebar
              currentSort={sort}
              selectedTags={selectedTags}
              minRating={minRating}
              groups={allGroups || []}
              searchParams={params}
              topContributors={topContributors}
            />
          </aside>
          
          {/* Main Content - Bookmark List */}
          <main className="lg:col-span-6">
            <BookmarkList
              bookmarks={filteredBookmarks}
              userFavorites={userFavorites}
              totalCount={filteredBookmarks.length}
            />
          </main>
          
          {/* Right Sidebar - Activity */}
          <aside className="lg:col-span-3">
            <ActivitySidebar
              recentActivity={recentActivity}
              popularTags={popularTags}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
