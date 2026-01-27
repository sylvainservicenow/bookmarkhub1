import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/bookmarks/[id]/view
 * 
 * Increments the view count for a bookmark.
 * Called client-side to avoid counting bot traffic.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  
  if (!id) {
    return NextResponse.json({ error: 'Missing bookmark ID' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Get current count and increment
  const { data: bookmark, error: fetchError } = await supabase
    .from('bookmarks')
    .select('click_count')
    .eq('id', id)
    .single()

  if (fetchError || !bookmark) {
    return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
  }

  const newCount = (bookmark.click_count || 0) + 1

  const { error: updateError } = await supabase
    .from('bookmarks')
    .update({ click_count: newCount })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 })
  }

  return NextResponse.json({ click_count: newCount })
}
