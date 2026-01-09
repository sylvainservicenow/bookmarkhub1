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
  
  let bookmarksQuery = supabase
    .from('bookmarks')
    .select(`
      *,
      bookmark_tags(tag_id, tags(name)),
      ratings(rating)
    `)
    .eq('status', 'active')
    .eq('is_public', true)
  
  if (query) {
    bookmarksQuery = bookmarksQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
  }
  
  if (domain) {
    bookmarksQuery = bookmarksQuery.ilike('domain', `%${domain}%`)
  }
  
  const { data: bookmarks } = await bookmarksQuery.limit(20)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <SearchBox />
      </div>
      
      {(query || tag || domain) && (
        <p className="text-gray-600 mb-6">
          {bookmarks?.length || 0} results
          {query && <span> for "{query}"</span>}
          {tag && <span> tagged "{tag}"</span>}
          {domain && <span> from {domain}</span>}
        </p>
      )}

      <div className="grid gap-4">
        {bookmarks && bookmarks.length > 0 ? (
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
