import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Tag, ChevronRight } from 'lucide-react'

export async function CategoryPills() {
  const supabase = await createClient()

  // Fetch tags with their bookmark counts in a more efficient way
  const { data: bookmarkTags } = await supabase
    .from('bookmark_tags')
    .select('tag_id, tags(id, name)')

  if (!bookmarkTags || bookmarkTags.length === 0) {
    return null
  }

  // Count occurrences of each tag
  const tagCounts: Record<string, { id: string; name: string; count: number }> = {}
  
  bookmarkTags.forEach((bt: any) => {
    if (bt.tags) {
      const tagId = bt.tags.id
      if (!tagCounts[tagId]) {
        tagCounts[tagId] = {
          id: bt.tags.id,
          name: bt.tags.name,
          count: 0
        }
      }
      tagCounts[tagId].count++
    }
  })

  // Sort by count and take top 12
  const tags = Object.values(tagCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  if (tags.length === 0) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500 mr-1 flex items-center gap-1">
          <Tag className="h-4 w-4" />
          Popular:
        </span>
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/browse?tag=${encodeURIComponent(tag.name)}`}
            className="group inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-all duration-150 hover:shadow-sm active:scale-95"
          >
            {tag.name}
            <span className="text-xs text-gray-400 group-hover:text-primary-500 transition-colors">
              {tag.count}
            </span>
          </Link>
        ))}
        <Link
          href="/tags"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          All tags
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
