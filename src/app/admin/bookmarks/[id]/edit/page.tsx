'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookmarkIcon, Link as LinkIcon, FileText, Tag, Globe, ArrowLeft, Lock, FolderOpen, Check } from 'lucide-react'
import Link from 'next/link'

interface TagType {
  id: string
  name: string
}

interface GroupType {
  id: string
  name: string
}

export default function AdminEditBookmarkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [bookmarkId, setBookmarkId] = useState<string>('')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<TagType[]>([])
  const [visibility, setVisibility] = useState<'public' | 'restricted'>('public')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [allGroups, setAllGroups] = useState<GroupType[]>([])
  const [status, setStatus] = useState('active')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { id } = await params
      setBookmarkId(id)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check if admin
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      // Fetch bookmark (admin can edit any)
      const { data: bookmark, error: bookmarkError } = await supabase
        .from('bookmarks')
        .select(`
          *,
          bookmark_tags (tag_id),
          bookmark_groups (group_id)
        `)
        .eq('id', id)
        .single()

      if (bookmarkError || !bookmark) {
        router.push('/admin/bookmarks')
        return
      }

      setUrl(bookmark.url)
      setTitle(bookmark.title)
      setDescription(bookmark.description || '')
      setVisibility(bookmark.visibility)
      setStatus(bookmark.status)
      setSelectedTags(bookmark.bookmark_tags?.map((bt: any) => bt.tag_id) || [])
      setSelectedGroupId(bookmark.bookmark_groups?.[0]?.group_id || null)

      // Fetch all tags
      const { data: tags } = await supabase
        .from('tags')
        .select('id, name')
        .eq('status', 'active')
        .order('name')
      
      if (tags) setAvailableTags(tags)

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
  }, [params, supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate URL
    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL')
      setLoading(false)
      return
    }

    // Validate restricted requires group
    if (visibility === 'restricted' && !selectedGroupId) {
      setError('Please select a group for restricted bookmarks')
      setLoading(false)
      return
    }

    // Update bookmark
    const { error: updateError } = await supabase
      .from('bookmarks')
      .update({
        url,
        title,
        description: description || null,
        visibility,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookmarkId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Update tags - delete existing and re-add
    await supabase
      .from('bookmark_tags')
      .delete()
      .eq('bookmark_id', bookmarkId)

    if (selectedTags.length > 0) {
      const tagInserts = selectedTags.map(tagId => ({
        bookmark_id: bookmarkId,
        tag_id: tagId,
      }))
      await supabase.from('bookmark_tags').insert(tagInserts)
    }

    // Update groups - delete existing and re-add if restricted
    await supabase
      .from('bookmark_groups')
      .delete()
      .eq('bookmark_id', bookmarkId)

    if (visibility === 'restricted' && selectedGroupId) {
      await supabase.from('bookmark_groups').insert({
        bookmark_id: bookmarkId,
        group_id: selectedGroupId,
      })
    }

    router.push('/admin/bookmarks')
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  if (initialLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin/bookmarks"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookmarks
        </Link>

        <div className="text-center mb-8">
          <BookmarkIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Edit Bookmark (Admin)</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* URL */}
          <div>
            <label htmlFor="url" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <LinkIcon className="h-4 w-4" />
              URL *
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <FileText className="h-4 w-4" />
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <FileText className="h-4 w-4" />
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Tag className="h-4 w-4" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-lg">
              {availableTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="hidden">Hidden</option>
              <option value="needs_fixing">Needs Fixing</option>
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
                    setSelectedGroupId(null)
                  }}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Public</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={visibility === 'restricted'}
                  onChange={() => setVisibility('restricted')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Restricted</span>
              </label>
            </div>
            
            {visibility === 'restricted' && (
              <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <label className="flex items-center gap-2 text-sm font-medium text-amber-800 mb-2">
                  <Lock className="h-4 w-4" />
                  Select a group *
                </label>
                <div className="flex flex-wrap gap-2">
                  {allGroups.map(group => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedGroupId === group.id
                          ? 'bg-amber-600 text-white'
                          : 'bg-white border border-amber-300 text-amber-800 hover:border-amber-500'
                      }`}
                    >
                      <FolderOpen className="h-4 w-4" />
                      {group.name}
                      {selectedGroupId === group.id && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/admin/bookmarks"
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
