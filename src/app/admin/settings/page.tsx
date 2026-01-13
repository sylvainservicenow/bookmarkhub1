'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import Link from 'next/link'
import { ArrowLeft, Settings, Save, Loader2, Check, RotateCcw } from 'lucide-react'

interface SiteSetting {
  id: string
  key: string
  value: string
  description: string | null
}

const settingLabels: Record<string, { label: string; type: 'text' | 'textarea' }> = {
  homepage_badge: { label: 'Badge Text', type: 'text' },
  homepage_title: { label: 'Main Headline', type: 'text' },
  homepage_subtitle: { label: 'Subtitle / Description', type: 'textarea' },
  homepage_search_placeholder: { label: 'Search Placeholder', type: 'text' },
  homepage_search_button: { label: 'Search Button Text', type: 'text' },
}

const defaultValues: Record<string, string> = {
  homepage_badge: 'Best ServiceNow resources at your fingertips',
  homepage_title: 'Discover & Share the Best Bookmarks',
  homepage_subtitle: 'Find curated ServiceNow bookmarks. Browse by popularity, explore categories, save your favorites and share your findings.',
  homepage_search_placeholder: 'Search bookmarks, tags, or groups...',
  homepage_search_button: 'Search',
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'
  
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [settings, setSettings] = useState<SiteSetting[]>([])
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    
    if (!user?.id) {
      router.push('/dashboard')
      return
    }

    const fetchData = async () => {
      // Fetch profile to check role
      const { data: profileData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      setProfile(profileData)
      
      if (profileData?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      // Fetch settings
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*')
        .order('key')
      
      if (settingsData) {
        setSettings(settingsData)
        const values: Record<string, string> = {}
        settingsData.forEach(s => {
          values[s.key] = s.value
        })
        setEditedValues(values)
      }
      
      setLoading(false)
    }

    fetchData()
  }, [user?.id, authLoading, router, supabase])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    
    try {
      // Update each setting
      for (const setting of settings) {
        if (editedValues[setting.key] !== setting.value) {
          await supabase
            .from('site_settings')
            .update({ 
              value: editedValues[setting.key],
              updated_at: new Date().toISOString(),
              updated_by: user?.id
            })
            .eq('key', setting.key)
        }
      }
      
      // Refresh settings
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*')
        .order('key')
      
      if (settingsData) {
        setSettings(settingsData)
      }
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = (key: string) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: defaultValues[key] || ''
    }))
  }

  const hasChanges = settings.some(s => editedValues[s.key] !== s.value)

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return null
  }

  // Group settings by category
  const homepageSettings = settings.filter(s => s.key.startsWith('homepage_'))

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Site Settings</h1>
              <p className="text-sm sm:text-base text-gray-600">Customize homepage content</p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Homepage Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Homepage Hero Section</h2>
        <p className="text-sm text-gray-500 mb-6">These texts appear on the main homepage hero section.</p>
        
        <div className="space-y-6">
          {homepageSettings.map(setting => {
            const config = settingLabels[setting.key]
            if (!config) return null
            
            const isChanged = editedValues[setting.key] !== setting.value
            
            return (
              <div key={setting.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    {config.label}
                    {isChanged && (
                      <span className="ml-2 text-xs text-amber-600 font-normal">(unsaved)</span>
                    )}
                  </label>
                  <button
                    onClick={() => handleReset(setting.key)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    title="Reset to default"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                </div>
                {setting.description && (
                  <p className="text-xs text-gray-500">{setting.description}</p>
                )}
                {config.type === 'textarea' ? (
                  <textarea
                    value={editedValues[setting.key] || ''}
                    onChange={(e) => setEditedValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-sm ${
                      isChanged ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                    }`}
                  />
                ) : (
                  <input
                    type="text"
                    value={editedValues[setting.key] || ''}
                    onChange={(e) => setEditedValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-sm ${
                      isChanged ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Preview Section */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 mb-4">
            <span className="text-xs font-medium text-gray-700">
              {editedValues.homepage_badge || 'Badge text'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {editedValues.homepage_title || 'Main headline'}
          </h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto mb-4">
            {editedValues.homepage_subtitle || 'Subtitle text'}
          </p>
          <div className="max-w-sm mx-auto relative">
            <input
              type="text"
              disabled
              placeholder={editedValues.homepage_search_placeholder || 'Search...'}
              className="w-full pl-4 pr-20 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-400"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary-500 text-white rounded-full text-xs">
              {editedValues.homepage_search_button || 'Search'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
