import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const supabase = createAdminClient()

  // Fetch current count and increment
  const { data: bookmark } = await supabase
    .from('bookmarks')
    .select('click_count')
    .eq('id', id)
    .single()
  
  if (bookmark) {
    await supabase
      .from('bookmarks')
      .update({ click_count: (bookmark.click_count || 0) + 1 })
      .eq('id', id)
  }

  return NextResponse.json({ success: true })
}
