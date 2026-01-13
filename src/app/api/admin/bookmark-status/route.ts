import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/admin'

// Update bookmark status with admin tracking
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const supabase = createAdminClient()
  
  // Check if admin
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()
  
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  
  const { bookmarkId, status, notes } = await request.json()
  
  if (!bookmarkId || !status) {
    return NextResponse.json({ error: 'Bookmark ID and status required' }, { status: 400 })
  }
  
  const validStatuses = ['active', 'submitted', 'checked', 'archived', 'hidden', 'needs_fixing', 'health_warning_1', 'health_warning_2', 'health_warning_3']
  
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  
  const updateData: any = {
    status,
    health_check_notes: notes || null,
  }
  
  // If marking as 'checked', record who checked it
  if (status === 'checked') {
    updateData.checked_by = session.user.id
    updateData.checked_at = new Date().toISOString()
  }
  
  // If setting to active from a warning state, reset failure count
  if (status === 'active') {
    updateData.failure_count = 0
  }
  
  const { error } = await supabase
    .from('bookmarks')
    .update(updateData)
    .eq('id', bookmarkId)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
