'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import { BookmarkIcon, Link as LinkIcon, FileText, Tag, Plus, X, Check, Loader2, Sparkles } from 'lucide-react'
import { getFaviconUrl } from '@/lib/utils/favicon'
import { BookmarkFavicon } from '@/components/bookmarks/BookmarkFavicon'

interface TagType {
  id: string
  name: string
  visibility: string
}

export default function SubmitPage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'
  
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<TagType[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [customTags, setCustomTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [fetchingTitle, setFetchingTitle] = useState(false)
  const [titleFetched, setTitleFetched] = useState(false)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    if (!user?.id) return

    const fetchData = async () => {
      const { data: tags } = await supabase
        .from('tags')
        .select('id, name, visibility')
        .eq('visibility', 'public')
        .eq('status', 'active')
        .order('name')
      
      if (tags) setAvailableTags(tags)
      
      setDataLoading(false)
    }

    fetchData()
  }, [user?.id, supabase])

  useEffect(() => {
    if (url) {
      const favicon = getFaviconUrl(url)
      setFaviconUrl(favicon)
    } else {
      setFaviconUrl(null)
    }
  }, [url])

  const fetchPageTitle = useCallback(async (urlToFetch: string) => {
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

  useEffect(() => {
    if (!url) {
      setTitleFetched(false)
      return
    }

    if (title) return

    const timeoutId = setTimeout(() => {
      fetchPageTitle(url)
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [url, fetchPageTitle, title])

  const handleAddCustomTag = () => {
    const trimmedTag = newTagName.trim()
    if (!trimmedTag) return
    
    const existingTag = availableTags.find(
      t => t.name.toLowerCase() === trimmedTag.toLowerCase()
    )
    if (existingTag) {
      if (!selectedTags.includes(existingTag.id)) {
        setSelectedTags(prev => [...prev, existingTag.id])
      }
      setNewTagName('')
      return
    }
    
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

    if (!user?.id) {
      setError('You must be logged in to submit a bookmark')
      setLoading(false)
      return
    }

    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL')
      setLoading(false)
      return
    }

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

    const bookmarkFaviconUrl = getFaviconUrl(url)

    const { data: bookmark, error: bookmarkError } = await supabase
      .from('bookmarks')
      .insert({
        url,
        title,
        description: description || null,
        visibility: 'public',
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

    if (selectedTags.length > 0 && bookmark) {
      const tagInserts = selectedTags.map(tagId => ({
        bookmark_id: bookmark.id,
        tag_id: tagId,
      }))
      await supabase.from('bookmark_tags').insert(tagInserts)
    }

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

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookmarkIcon className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bookmark Submitted!</h1>
          <p className="text-gray-600 mb-6">Your bookmark has been added successfully.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSuccess(false)
                setUrl('')
                setTitle('')
                setDescription('')
                setSelectedTags([])
                setCustomTags([])
                setTitleFetched(false)
                setFaviconUrl(null)
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Submit Another
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 px-4 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <BookmarkIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Submit a Bookmark</h1>
          <p className="text-gray-600 mt-2">Share a useful link with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
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
                disabled={loading}
                placeholder="https://example.com/article"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-50 transition-colors"
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
              disabled={loading}
              placeholder="A descriptive title for this bookmark"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-50 transition-colors ${
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
              disabled={loading}
              placeholder="Optional: Add a brief description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none disabled:bg-gray-50 transition-colors"
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
                        disabled={loading}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                          isSelected
                            ? 'bg-primary-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-400 hover:text-primary-600'
                        } disabled:opacity-50`}
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

            <div>
              <p className="text-xs text-gray-500 mb-2">Or create a new tag:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  placeholder="Type a new tag name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm disabled:bg-gray-50 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  disabled={!newTagName.trim() || loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Press Enter or click + to add</p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Bookmark'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
