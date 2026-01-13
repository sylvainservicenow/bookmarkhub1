import { createAdminClient } from '@/lib/supabase/admin'

// Default values as fallback
const defaults: Record<string, string> = {
  homepage_badge: 'Best ServiceNow resources at your fingertips',
  homepage_title: 'Discover & Share the Best Bookmarks',
  homepage_subtitle: 'Find curated ServiceNow bookmarks. Browse by popularity, explore categories, save your favorites and share your findings.',
  homepage_search_placeholder: 'Search bookmarks, tags, or groups...',
  homepage_search_button: 'Search',
}

// Fetch settings from database (server-side)
export async function getSettings(): Promise<Record<string, string>> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
    
    if (error) {
      console.error('Error fetching settings:', error)
      return defaults
    }
    
    const settings: Record<string, string> = { ...defaults }
    data?.forEach(item => {
      settings[item.key] = item.value
    })
    
    return settings
  } catch (error) {
    console.error('Error in getSettings:', error)
    return defaults
  }
}

// Get a single setting value
export async function getSetting(key: string): Promise<string> {
  const settings = await getSettings()
  return settings[key] || defaults[key] || ''
}
