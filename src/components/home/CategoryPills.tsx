'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tag, Loader2, ChevronRight } from 'lucide-react'

interface TagWithCount {
  id: string
  name: string
  count: number
}

export function CategoryPills() {
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    
    async function fetchTags() {
      try {
        // First get all tags
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('id, name')
          .order('name')

        if (tagsError) throw tagsError
        if (!mountedRef.current) return

        // Then count bookmarks for each tag
        const tagsWithCounts = await Promise.all(
          (tagsData || []).map(async (tag) => {
            if (!mountedRef.current) return { ...tag, count: 0 }
            
            const { count } = await supabase
              .from('bookmark_tags')
              .select('*', { count: 'exact', head: true })
              .eq('tag_id', tag.id)

            return {
              ...tag,
              count: count || 0
            }
          })
        )

        if (!mountedRef.current) return

        // Sort by count and take top 12
        const sortedTags = tagsWithCounts
          .filter(t => t.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 12)

        setTags(sortedTags)
      } catch (err) {
        // Silently handle AbortError from component unmount
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        console.error('Error fetching tags:', err)
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchTags()
    
    return () => {
      mountedRef.current = false
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (tags.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500 mr-1 flex items-center gap-1">
        <Tag className="h-4 w-4" />
        Popular:
      </span>
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/search?tag=${encodeURIComponent(tag.name)}`}
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
  )
}
