import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Tag, Palette, Code, Zap, MessageCircle, TrendingUp } from 'lucide-react'

// Map category names to icons and emojis
const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; emoji: string }> = {
  'All': { icon: <Tag className="h-4 w-4" />, emoji: '🏷️' },
  'Design': { icon: <Palette className="h-4 w-4" />, emoji: '🎨' },
  'Development': { icon: <Code className="h-4 w-4" />, emoji: '💻' },
  'Productivity': { icon: <Zap className="h-4 w-4" />, emoji: '⚡' },
  'Communication': { icon: <MessageCircle className="h-4 w-4" />, emoji: '💬' },
  'Marketing': { icon: <TrendingUp className="h-4 w-4" />, emoji: '📈' },
}

export async function CategoryPills() {
  const supabase = await createClient()
  
  // Get all active tags with bookmark counts
  const { data: tags } = await supabase
    .from('tags')
    .select('id, name')
    .eq('status', 'active')
    .order('name')
  
  // Get total bookmark count
  const { count: totalCount } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('visibility', 'public')
  
  // Get bookmark counts per tag
  const { data: tagCounts } = await supabase
    .from('bookmark_tags')
    .select('tag_id, bookmarks!inner(id, status, visibility)')
    .eq('bookmarks.status', 'active')
    .eq('bookmarks.visibility', 'public')
  
  // Count bookmarks per tag
  const countByTag: Record<string, number> = {}
  tagCounts?.forEach((item: any) => {
    countByTag[item.tag_id] = (countByTag[item.tag_id] || 0) + 1
  })
  
  // Build categories with counts
  const categories = [
    { name: 'All', count: totalCount || 0, href: '/browse' },
    ...(tags || []).slice(0, 5).map(tag => ({
      name: tag.name,
      count: countByTag[tag.id] || 0,
      href: `/browse?tag=${encodeURIComponent(tag.name)}`,
    })),
  ]

  return (
    <section className="border-y border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category, index) => {
            const config = CATEGORY_CONFIG[category.name] || { emoji: '📁' }
            const isAll = category.name === 'All'
            
            return (
              <Link
                key={category.name}
                href={category.href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                  ${isAll 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                  }
                `}
              >
                <span>{config.emoji}</span>
                <span>{category.name}</span>
                <span className={`
                  px-2 py-0.5 rounded-full text-xs
                  ${isAll 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {category.count}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
