import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/settings - Fetch all site settings
export async function GET() {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
    
    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
    
    // Convert to key-value object
    const settings: Record<string, string> = {}
    data?.forEach(item => {
      settings[item.key] = item.value
    })
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error in settings API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
