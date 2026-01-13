import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ArrowLeft, Tag } from 'lucide-react'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default async function TagsPage() {
  const supabase = getSupabase()
  
  // Get all active tags with usage count
  const { data: tags } = await supabase
    .from('tags')
    .select('id, name')
    .eq('status', 'active')
    .order('name')
  
  // Get bookmark counts per tag
  const { data: tagCounts } = await supabase
    .from('bookmark_tags')
    .select('tag_id')
  
  // Count usage
  const countMap: Record<string, number> = {}
  tagCounts?.forEach((bt: any) => {
    countMap[bt.tag_id] = (countMap[bt.tag_id] || 0) + 1
  })
  
  // Sort tags by usage count (descending), then by name
  const sortedTags = (tags || [])
    .map(tag => ({ ...tag, count: countMap[tag.id] || 0 }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.name.localeCompare(b.name)
    })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Tag className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
          <p className="text-gray-600">Browse bookmarks by tag</p>
        </div>
      </div>
      
      {sortedTags.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex flex-wrap gap-3">
            {sortedTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/search?tag=${encodeURIComponent(tag.name)}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-primary-100 hover:text-primary-700 transition-colors"
              >
                <span className="font-medium">{tag.name}</span>
                <span className="text-sm text-gray-400">({tag.count})</span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No tags available yet.</p>
        </div>
      )}
    </div>
  )
}
