import { createClient } from '@/lib/supabase/server'
import { SearchBox } from '@/components/search/SearchBox'
import { BookmarkCard } from '@/components/bookmarks/BookmarkCard'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; domain?: string }>
}) {
  const params = await searchParams
  const query = params.q || ''
  const tag = params.tag || ''
  const domain = params.domain || ''
  
  const supabase = await createClient()
  
  let bookmarks: any[] = []
  
  // If searching by tag, we need a different approach
  if (tag) {
    const { data } = await supabase
      .from('bookmarks')
      .select(`
        *,
        bookmark_tags!inner(
          tags!inner(id, name)
        ),
        ratings(rating)
      `)
      .eq('status', 'active')
      .eq('visibility', 'public')
      .ilike('bookmark_tags.tags.name', tag)
      .limit(20)
    
    bookmarks = data || []
  } else {
    // Regular search
    let bookmarksQuery = supabase
      .from('bookmarks')
      .select(`
        *,
        bookmark_tags(tag_id, tags(name)),
        ratings(rating)
      `)
      .eq('status', 'active')
      .eq('visibility', 'public')
    
    if (query) {
      bookmarksQuery = bookmarksQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }
    
    if (domain) {
      bookmarksQuery = bookmarksQuery.ilike('url', `%${domain}%`)
    }
    
    const { data } = await bookmarksQuery.order('created_at', { ascending: false }).limit(20)
    bookmarks = data || []
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <SearchBox initialQuery={query} />
      </div>
      
      {(query || tag || domain) && (
        <p className="text-gray-600 mb-6">
          {bookmarks.length} result{bookmarks.length !== 1 ? 's' : ''}
          {query && <span> for &quot;{query}&quot;</span>}
          {tag && <span> tagged &quot;{tag}&quot;</span>}
          {domain && <span> from {domain}</span>}
        </p>
      )}

      <div className="grid gap-4">
        {bookmarks.length > 0 ? (
          bookmarks.map((bookmark: any) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            {query || tag || domain ? 'No bookmarks found' : 'Enter a search term to find bookmarks'}
          </div>
        )}
      </div>
    </div>
  )
}
