'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookmarkIcon, Link as LinkIcon, FileText, Tag, Globe, Plus, X, Check, FolderOpen, Lock, Loader2, Sparkles } from 'lucide-react'
import { getFaviconUrl } from '@/lib/utils/favicon'
import { BookmarkFavicon } from '@/components/bookmarks/BookmarkFavicon'

interface TagType {
  id: string
  name: string
  visibility: string
}

interface GroupType {
  id: string
  name: string
}

export default function SubmitPage() {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<TagType[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [customTags, setCustomTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState<'public' | 'restricted'>('public')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [userGroups, setUserGroups] = useState<GroupType[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [fetchingTitle, setFetchingTitle] = useState(false)
  const [titleFetched, setTitleFetched] = useState(false)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/submit')
        return
      }
      setUser(user)
      
      // Fetch user's groups
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, groups(id, name, status)')
        .eq('user_id', user.id)
        .eq('status', 'active')
      
      if (memberships) {
        const groups = memberships
          .map((m: any) => m.groups)
          .filter((g: any) => g && g.status === 'active')
        setUserGroups(groups)
      }
    }
    checkUser()

    const fetchTags = async () => {
      const { data } = await supabase
        .from('tags')
        .select('id, name, visibility')
        .eq('visibility', 'public')
        .eq('status', 'active')
        .order('name')
      if (data) setAvailableTags(data)
    }
    fetchTags()
  }, [supabase, router])

  // Update favicon when URL changes
  useEffect(() => {
    if (url) {
      const favicon = getFaviconUrl(url)
      setFaviconUrl(favicon)
    } else {
      setFaviconUrl(null)
    }
  }, [url])

  // Debounced fetch title function
  const fetchPageTitle = useCallback(async (urlToFetch: string) => {
    // Validate URL first
    try {
      new URL(urlToFetch)
    } catch {
      return
    }

    setFetchingTitle(true)
    setTitleFetched(false)

    try {
      const response = await fetch('/api/fetch-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.title && !title) {
          setTitle(data.title)
          setTitleFetched(true)
        }
        if (data.description && !description) {
          setDescription(data.description)
        }
      }
    } catch (error) {
      console.error('Error fetching title:', error)
    } finally {
      setFetchingTitle(false)
    }
  }, [title, description])

  // Auto-fetch title when URL changes (with debounce)
  useEffect(() => {
    if (!url) {
      setTitleFetched(false)
      return
    }

    // Only fetch if title is empty
    if (title) return

    const timeoutId = setTimeout(() => {
      fetchPageTitle(url)
    }, 800) // Wait 800ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [url, fetchPageTitle, title])

  const handleAddCustomTag = () => {
    const trimmedTag = newTagName.trim()
    if (!trimmedTag) return
    
    // Check if tag already exists in available tags
    const existingTag = availableTags.find(
      t => t.name.toLowerCase() === trimmedTag.toLowerCase()
    )
    if (existingTag) {
      // Select the existing tag instead
      if (!selectedTags.includes(existingTag.id)) {
        setSelectedTags(prev => [...prev, existingTag.id])
      }
      setNewTagName('')
      return
    }
    
    // Check if already in custom tags
    if (customTags.some(t => t.toLowerCase() === trimmedTag.toLowerCase())) {
      setNewTagName('')
      return
    }
    
    setCustomTags(prev => [...prev, trimmedTag])
    setNewTagName('')
  }

  const handleRemoveCustomTag = (tagToRemove: string) => {
    setCustomTags(prev => prev.filter(t => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCustomTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!user) {
      setError('You must be logged in to submit a bookmark')
      setLoading(false)
      return
    }

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

    // Check if URL already exists
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('url', url)
      .single()

    if (existing) {
      setError('This URL has already been submitted')
      setLoading(false)
      return
    }

    // Generate favicon URL
    const bookmarkFaviconUrl = getFaviconUrl(url)

    // Create bookmark with favicon_url
    const { data: bookmark, error: bookmarkError } = await supabase
      .from('bookmarks')
      .insert({
        url,
        title,
        description: description || null,
        visibility,
        status: 'active',
        creator_id: user.id,
        favicon_url: bookmarkFaviconUrl,
      })
      .select()
      .single()

    if (bookmarkError) {
      setError(bookmarkError.message)
      setLoading(false)
      return
    }

    // If restricted, add to bookmark_groups junction table
    if (visibility === 'restricted' && selectedGroupId && bookmark) {
      const { error: groupError } = await supabase
        .from('bookmark_groups')
        .insert({
          bookmark_id: bookmark.id,
          group_id: selectedGroupId,
        })
      
      if (groupError) {
        console.error('Error adding bookmark to group:', groupError)
      }
    }

    // Add existing tags
    if (selectedTags.length > 0 && bookmark) {
      const tagInserts = selectedTags.map(tagId => ({
        bookmark_id: bookmark.id,
        tag_id: tagId,
      }))
      await supabase.from('bookmark_tags').insert(tagInserts)
    }

    // Create and add custom tags
    if (customTags.length > 0 && bookmark) {
      for (const tagName of customTags) {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({
            name: tagName,
            visibility: 'public',
            status: 'active',
            created_by: user.id,
          })
          .select()
          .single()

        if (newTag) {
          await supabase.from('bookmark_tags').insert({
            bookmark_id: bookmark.id,
            tag_id: newTag.id,
          })
        }
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookmarkIcon className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bookmark Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Your bookmark has been added successfully.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSuccess(false)
                setUrl('')
                setTitle('')
                setDescription('')
                setSelectedTags([])
                setCustomTags([])
                setVisibility('public')
                setSelectedGroupId(null)
                setTitleFetched(false)
                setFaviconUrl(null)
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Submit Another
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <BookmarkIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Submit a Bookmark</h1>
          <p className="text-gray-600 mt-2">Share a useful link with the community</p>
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
            <div className="flex gap-2">
              {faviconUrl && (
                <div className="flex items-center justify-center w-10 h-10 bg-gray-50 border border-gray-300 rounded-lg">
                  <BookmarkFavicon faviconUrl={faviconUrl} title={title || 'Preview'} size="md" />
                </div>
              )}
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://example.com/article"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            {fetchingTitle && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Fetching page info...
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <FileText className="h-4 w-4" />
              Title *
              {titleFetched && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Auto-filled
                </span>
              )}
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setTitleFetched(false)
              }}
              required
              placeholder="A descriptive title for this bookmark"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                titleFetched ? 'border-green-300 bg-green-50' : 'border-gray-300'
              }`}
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
              placeholder="Optional: Add a brief description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>

          {/* Tags Section */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Tag className="h-4 w-4" />
              Tags
              {(selectedTags.length > 0 || customTags.length > 0) && (
                <span className="text-primary-600">
                  ({selectedTags.length + customTags.length} selected)
                </span>
              )}
            </label>
            
            {/* Select existing tags */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Select from existing tags:</p>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                {availableTags.length > 0 ? (
                  availableTags.map(tag => {
                    const isSelected = selectedTags.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                          isSelected
                            ? 'bg-primary-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-400 hover:text-primary-600'
                        }`}
                      >
                        {tag.name}
                        {isSelected && <Check className="h-3 w-3" />}
                      </button>
                    )
                  })
                ) : (
                  <span className="text-gray-400 text-sm">No tags available</span>
                )}
              </div>
            </div>

            {/* Custom tags display */}
            {customTags.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">New tags to create:</p>
                <div className="flex flex-wrap gap-2">
                  {customTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomTag(tag)}
                        className="hover:text-green-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add new tag input */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Or create a new tag:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a new tag name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  disabled={!newTagName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Press Enter or click + to add</p>
            </div>
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
            
            {/* Group selection for restricted */}
            {visibility === 'restricted' && (
              <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <label className="flex items-center gap-2 text-sm font-medium text-amber-800 mb-2">
                  <Lock className="h-4 w-4" />
                  Select a group *
                </label>
                {userGroups.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userGroups.map(group => (
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
                ) : (
                  <p className="text-amber-700 text-sm">
                    You are not a member of any groups yet.{' '}
                    <a href="/groups" className="underline hover:text-amber-900">
                      Browse groups to join
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || (visibility === 'restricted' && !selectedGroupId)}
            className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Bookmark'}
          </button>
        </form>
      </div>
    </div>
  )
}
