'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Calendar, Shield, Save, Check } from 'lucide-react'

export default function SettingsPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [role, setRole] = useState('')
  const [createdAt, setCreatedAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login?redirect=/settings')
        return
      }
      
      setUser(user)
      setEmail(user.email || '')
      
      // Get profile from public.users
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setName(profile.name || '')
        setAvatarUrl(profile.avatar_url || '')
        setRole(profile.role || 'user')
        setCreatedAt(profile.created_at)
      }
      
      setLoading(false)
    }
    
    loadUser()
  }, [supabase, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    setSuccess(false)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        name,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <Check className="h-4 w-4" />
            Settings saved successfully!
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        {/* Avatar URL */}
        <div>
          <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">
            Avatar URL
          </label>
          <input
            id="avatar"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
          {avatarUrl && (
            <div className="mt-2">
              <img 
                src={avatarUrl} 
                alt="Avatar preview" 
                className="w-16 h-16 rounded-full object-cover border border-gray-200"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Account Info (Read-only) */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Account Information
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <Mail className="h-4 w-4" />
            <span className="font-medium">Email:</span>
            <span>{email}</span>
          </div>
          
          <div className="flex items-center gap-3 text-gray-600">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Role:</span>
            <span className="capitalize">{role}</span>
          </div>
          
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Member since:</span>
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          To change your email or password, please contact an administrator.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <Link href="/bookmarks" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <div className="text-2xl font-bold text-primary-600">-</div>
            <div className="text-sm text-gray-600">Bookmarks</div>
          </Link>
          <Link href="/favorites" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <div className="text-2xl font-bold text-red-500">-</div>
            <div className="text-sm text-gray-600">Favorites</div>
          </Link>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-500">-</div>
            <div className="text-sm text-gray-600">Ratings</div>
          </div>
        </div>
      </div>
    </div>
  )
}
