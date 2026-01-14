import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export async function CategoryPills() {
  const supabase = createAdminClient()
  
  // Fetch top tags - NO counts (removed to reduce queries)
  const { data: tags } = await supabase
    .from('tags')
    .select('id, name')
    .eq('status', 'active')
    .eq('visibility', 'public')
    .order('name')
    .limit(12)

  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-wrap gap-2 justify-center">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/browse?tag=${encodeURIComponent(tag.name)}`}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full hover:border-primary-400 hover:text-primary-600 transition-colors text-sm font-medium"
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </section>
  )
}
