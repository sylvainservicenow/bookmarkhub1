import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/admin/import-bookmarks
// Imports bookmarks from JSON data
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookmarks } = await request.json()

    if (!bookmarks || !Array.isArray(bookmarks)) {
      return NextResponse.json({ error: 'No bookmarks provided' }, { status: 400 })
    }

    const results = {
      total: bookmarks.length,
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    }

    // Get group IDs
    const { data: groups } = await supabase.from('groups').select('id, name')
    const groupMap = new Map(groups?.map(g => [g.name, g.id]) || [])

    // Get tag IDs  
    const { data: tags } = await supabase.from('tags').select('id, name')
    const tagMap = new Map(tags?.map(t => [t.name.toLowerCase(), t.id]) || [])

    for (const bookmark of bookmarks) {
      try {
        // Get favicon URL
        let faviconUrl = ''
        try {
          const urlObj = new URL(bookmark.url)
          faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
        } catch {}

        // Check if bookmark already exists
        const { data: existing } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('url', bookmark.url)
          .single()

        if (existing) {
          results.skipped++
          continue
        }

        // Insert bookmark
        const { data: newBookmark, error: bookmarkError } = await supabase
          .from('bookmarks')
          .insert({
            url: bookmark.url,
            title: bookmark.title.substring(0, 255),
            description: bookmark.description || bookmark.title.substring(0, 200),
            visibility: bookmark.groupName ? 'restricted' : 'public',
            status: 'active',
            creator_id: user.id,
            favicon_url: faviconUrl
          })
          .select('id')
          .single()

        if (bookmarkError) {
          results.errors.push(`${bookmark.url}: ${bookmarkError.message}`)
          continue
        }

        // Add to group if restricted
        if (bookmark.groupName && newBookmark) {
          const groupId = groupMap.get(bookmark.groupName)
          if (groupId) {
            await supabase.from('bookmark_groups').insert({
              bookmark_id: newBookmark.id,
              group_id: groupId
            })
          }
        }

        // Add tags
        if (bookmark.tags && bookmark.tags.length > 0 && newBookmark) {
          const tagInserts = bookmark.tags
            .map((tagName: string) => {
              const tagId = tagMap.get(tagName.toLowerCase())
              return tagId ? { bookmark_id: newBookmark.id, tag_id: tagId } : null
            })
            .filter(Boolean)
          
          if (tagInserts.length > 0) {
            await supabase.from('bookmark_tags').insert(tagInserts)
          }
        }

        results.imported++
      } catch (err: any) {
        results.errors.push(`${bookmark.url}: ${err.message}`)
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
