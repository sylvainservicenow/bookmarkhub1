import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export async function CategoryPills() {
  const supabase = createAdminClient()
  
  // Fetch top tags with bookmark counts
  const { data: tags } = await supabase
    .from('tags')
    .select(`
      id,
      name,
      bookmark_tags(count)
    `)
    .eq('status', 'active')
    .eq('visibility', 'public')
    .order('name')
    .limit(15)

  if (!tags || tags.length === 0) {
    return null
  }

  // Sort by bookmark count
  const sortedTags = tags
    .map(tag => ({
      ...tag,
      count: (tag.bookmark_tags as any)?.[0]?.count || 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-wrap gap-2 justify-center">
        {sortedTags.map((tag) => (
          <Link
            key={tag.id}
            href={`/search?tag=${encodeURIComponent(tag.name)}`}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full hover:border-primary-400 hover:text-primary-600 transition-colors text-sm font-medium"
          >
            {tag.name}
            {tag.count > 0 && (
              <span className="ml-1.5 text-gray-400 text-xs">({tag.count})</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
