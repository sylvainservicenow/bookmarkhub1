import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Bookmark, Globe, Tag } from 'lucide-react'

export async function TopStats() {
  const supabase = await createClient()
  
  // Fetch homepage stats from cached table
  const { data: stats } = await supabase
    .from('homepage_stats')
    .select('stat_type, data')
  
  const topBookmarks = stats?.find(s => s.stat_type === 'top_bookmarks')?.data || []
  const topDomains = stats?.find(s => s.stat_type === 'top_domains')?.data || []
  const topTags = stats?.find(s => s.stat_type === 'top_tags')?.data || []

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Top Bookmarks */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bookmark className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Top Bookmarks</h2>
          </div>
          <ul className="space-y-2">
            {topBookmarks.length > 0 ? (
              topBookmarks.slice(0, 5).map((bookmark: any, i: number) => (
                <li key={i}>
                  <Link
                    href={`/bookmark/${bookmark.id}`}
                    className="text-gray-600 hover:text-primary-600 truncate block"
                  >
                    {bookmark.title}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-gray-400 text-sm">No bookmarks yet</li>
            )}
          </ul>
        </div>

        {/* Top Domains */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Top Domains</h2>
          </div>
          <ul className="space-y-2">
            {topDomains.length > 0 ? (
              topDomains.slice(0, 5).map((domain: any, i: number) => (
                <li key={i}>
                  <Link
                    href={`/search?domain=${encodeURIComponent(domain.domain)}`}
                    className="text-gray-600 hover:text-primary-600"
                  >
                    {domain.domain}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-gray-400 text-sm">No domains yet</li>
            )}
          </ul>
        </div>

        {/* Top Tags */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Top Tags</h2>
          </div>
          <ul className="space-y-2">
            {topTags.length > 0 ? (
              topTags.slice(0, 5).map((tag: any, i: number) => (
                <li key={i}>
                  <Link
                    href={`/search?tag=${encodeURIComponent(tag.name)}`}
                    className="text-gray-600 hover:text-primary-600"
                  >
                    {tag.name}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-gray-400 text-sm">No tags yet</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
