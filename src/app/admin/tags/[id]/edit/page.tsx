'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import { Tag, ArrowLeft, Globe, Lock, FolderOpen, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface GroupType {
  id: string
  name: string
}

export default function AdminEditTagPage() {
  const params = useParams()
  const tagId = params.id as string
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'

  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'restricted'>('public')
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [allGroups, setAllGroups] = useState<GroupType[]>([])
  const [tagStatus, setTagStatus] = useState('active')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    if (authLoading || !tagId) return
    
    if (!user?.id) {
      router.push('/login')
      return
    }

    const init = async () => {
      // Check if admin
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

      // Fetch tag with group associations
      const { data: tag, error: tagError } = await supabase
        .from('tags')
        .select(`
          *,
          tag_groups (group_id)
        `)
        .eq('id', tagId)
        .single()

      if (tagError || !tag) {
        router.push('/admin/tags')
        return
      }

      setName(tag.name)
      setVisibility(tag.visibility)
      setTagStatus(tag.status)
      setSelectedGroupIds(tag.tag_groups?.map((tg: any) => tg.group_id) || [])

      // Fetch all groups
      const { data: groups } = await supabase
        .from('groups')
        .select('id, name')
        .eq('status', 'active')
        .order('name')
      
      if (groups) setAllGroups(groups)

      setInitialLoading(false)
    }

    init()
  }, [tagId, user?.id, authLoading, supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!name.trim()) {
      setError('Tag name is required')
      setLoading(false)
      return
    }

    // Validate restricted requires at least one group
    if (visibility === 'restricted' && selectedGroupIds.length === 0) {
      setError('Please select at least one group for restricted tags')
      setLoading(false)
      return
    }

    // Update tag
    const { error: updateError } = await supabase
      .from('tags')
      .update({
        name: name.trim(),
        visibility,
        status: tagStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tagId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Update group associations - delete existing and re-add
    await supabase
      .from('tag_groups')
      .delete()
      .eq('tag_id', tagId)

    if (visibility === 'restricted' && selectedGroupIds.length > 0) {
      const groupInserts = selectedGroupIds.map(groupId => ({
        tag_id: tagId,
        group_id: groupId,
      }))
      await supabase.from('tag_groups').insert(groupInserts)
    }

    router.push('/admin/tags')
  }

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  if (authLoading || initialLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin/tags"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tags
        </Link>

        <div className="text-center mb-8">
          <Tag className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Edit Tag</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Tag className="h-4 w-4" />
              Tag Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
            <select
              value={tagStatus}
              onChange={(e) => setTagStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Visibility */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Globe className="h-4 w-4" />
              Visibility
            </label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={visibility === 'public'}
                  onChange={() => {
                    setVisibility('public')
                    setSelectedGroupIds([])
                  }}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Public (visible to everyone)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={visibility === 'restricted'}
                  onChange={() => setVisibility('restricted')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Restricted (group members only)</span>
              </label>
            </div>
            
            {visibility === 'restricted' && (
              <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <label className="flex items-center gap-2 text-sm font-medium text-purple-800 mb-2">
                  <Lock className="h-4 w-4" />
                  Select groups that can see this tag *
                </label>
                <div className="flex flex-wrap gap-2">
                  {allGroups.map(group => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedGroupIds.includes(group.id)
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-purple-300 text-purple-800 hover:border-purple-500'
                      }`}
                    >
                      <FolderOpen className="h-4 w-4" />
                      {group.name}
                      {selectedGroupIds.includes(group.id) && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
                {allGroups.length === 0 && (
                  <p className="text-purple-700 text-sm">No groups available</p>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/admin/tags"
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
