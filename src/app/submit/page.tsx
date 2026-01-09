'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookmarkIcon, Link as LinkIcon, FileText, Tag, Globe, Plus, X } from 'lucide-react'

interface TagType {
  id: string
  name: string
  visibility: string
}

export default function SubmitPage() {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<TagType[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [customTags, setCustomTags] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  
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

    // Create bookmark
    const { data: bookmark, error: bookmarkError } = await supabase
      .from('bookmarks')
      .insert({
        url,
        title,
        description: description || null,
        visibility: isPublic ? 'public' : 'restricted',
        status: 'active',
        creator_id: user.id,
      })
      .select()
      .single()

    if (bookmarkError) {
      setError(bookmarkError.message)
      setLoading(false)
      return
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
        // Create the new tag
        const { data: newTag } = await supabase
          .from('tags')
          .insert({
            name: tagName,
            visibility: 'public',
            status: 'active',
            creator_id: user.id,
          })
          .select()
          .single()

        // Link tag to bookmark
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
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://example.com/article"
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
              placeholder="A descriptive title for this bookmark"
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
              placeholder="Optional: Add a brief description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Tag className="h-4 w-4" />
              Tags
            </label>
            
            {/* Existing tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {availableTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>

            {/* Custom tags display */}
            {customTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {customTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
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
            )}

            {/* Add new tag input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a new tag..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                disabled={!newTagName.trim()}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Press Enter or click + to add a new tag</p>
          </div>

          {/* Visibility */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Globe className="h-4 w-4" />
              Visibility
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Public</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Restricted</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Bookmark'}
          </button>
        </form>
      </div>
    </div>
  )
}
