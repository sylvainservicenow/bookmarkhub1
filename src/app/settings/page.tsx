'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Calendar, Shield, Save, Check } from 'lucide-react'

// 25 avatar options - fun, inclusive, non-human icons
const AVATAR_OPTIONS = [
  { id: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'dog', emoji: '🐶', label: 'Dog' },
  { id: 'fox', emoji: '🦊', label: 'Fox' },
  { id: 'panda', emoji: '🐼', label: 'Panda' },
  { id: 'koala', emoji: '🐨', label: 'Koala' },
  { id: 'lion', emoji: '🦁', label: 'Lion' },
  { id: 'tiger', emoji: '🐯', label: 'Tiger' },
  { id: 'bear', emoji: '🐻', label: 'Bear' },
  { id: 'rabbit', emoji: '🐰', label: 'Rabbit' },
  { id: 'owl', emoji: '🦉', label: 'Owl' },
  { id: 'penguin', emoji: '🐧', label: 'Penguin' },
  { id: 'butterfly', emoji: '🦋', label: 'Butterfly' },
  { id: 'dolphin', emoji: '🐬', label: 'Dolphin' },
  { id: 'unicorn', emoji: '🦄', label: 'Unicorn' },
  { id: 'dragon', emoji: '🐉', label: 'Dragon' },
  { id: 'rocket', emoji: '🚀', label: 'Rocket' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'sun', emoji: '🌞', label: 'Sun' },
  { id: 'moon', emoji: '🌙', label: 'Moon' },
  { id: 'rainbow', emoji: '🌈', label: 'Rainbow' },
  { id: 'flower', emoji: '🌸', label: 'Flower' },
  { id: 'tree', emoji: '🌳', label: 'Tree' },
  { id: 'mountain', emoji: '🏔️', label: 'Mountain' },
  { id: 'crystal', emoji: '💎', label: 'Crystal' },
  { id: 'robot', emoji: '🤖', label: 'Robot' },
]

export default function SettingsPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
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
        setSelectedAvatar(profile.avatar_url || '')
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
        avatar_url: selectedAvatar || null,
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

  const currentAvatar = AVATAR_OPTIONS.find(a => a.id === selectedAvatar)

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

        {/* Current Avatar Preview */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-4xl border-2 border-primary-200">
            {currentAvatar ? currentAvatar.emoji : <User className="h-10 w-10 text-primary-600" />}
          </div>
          <div>
            <p className="font-medium text-gray-900">{currentAvatar ? currentAvatar.label : 'No avatar selected'}</p>
            <p className="text-sm text-gray-500">Choose an avatar below</p>
          </div>
        </div>

        {/* Avatar Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose Your Avatar
          </label>
          <div className="grid grid-cols-5 gap-3">
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setSelectedAvatar(avatar.id)}
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all ${
                  selectedAvatar === avatar.id
                    ? 'bg-primary-100 border-2 border-primary-500 scale-110 shadow-md'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:scale-105'
                }`}
                title={avatar.label}
              >
                {avatar.emoji}
              </button>
            ))}
          </div>
          {selectedAvatar && (
            <button
              type="button"
              onClick={() => setSelectedAvatar('')}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear selection
            </button>
          )}
        </div>

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
    </div>
  )
}
