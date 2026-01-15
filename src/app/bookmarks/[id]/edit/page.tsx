'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import { BookmarkIcon, Link as LinkIcon, FileText, Tag, Globe, Lock, ArrowLeft, Loader2, Save, Archive, RotateCcw, Plus, X, Check, Clock } from 'lucide-react'
import Link from 'next/link'

interface TagType {
  id: string
  name: string
}

export default function EditBookmarkPage() {
  const params = useParams()
  const bookmarkId = params.id as string
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'
  
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<TagType[]>([])
  const [customTags, setCustomTags] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isArchived, setIsArchived] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [pendingTagsSubmitted, setPendingTagsSubmitted] = useState(false)
  const mountedRef = useRef(true)
  const fetchedRef = useRef(false)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    mountedRef.current = true
    
    const init = async () => {
      if (fetchedRef.current) return
      
      if (!user) {
        if (!authLoading) {
          router.push(`/login?redirect=/bookmarks/${bookmarkId}/edit`)
        }
        return
      }

      fetchedRef.current = true

      try {
        // Fetch user profile for admin check
        const { data: profileData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (mountedRef.current) {
          setProfile(profileData)
        }

        // Fetch the bookmark
        const { data: bookmark, error: bookmarkError } = await supabase
          .from('bookmarks')
          .select('*, bookmark_tags (tag_id)')
          .eq('id', bookmarkId)
          .maybeSingle()

        if (!mountedRef.current) return

        if (bookmarkError) {
          console.error('Error fetching bookmark:', bookmarkError)
          setError('Failed to load bookmark')
          setInitialLoading(false)
          return
        }

        if (!bookmark) {
          setNotFound(true)
          setInitialLoading(false)
          return
        }

        // Check permission: must be creator OR admin
        const isCreator = bookmark.creator_id === user.id
        const isAdmin = profileData?.role === 'admin'
        
        if (!isCreator && !isAdmin) {
          setPermissionDenied(true)
          setInitialLoading(false)
          return
        }

        setUrl(bookmark.url)
        setTitle(bookmark.title)
        setDescription(bookmark.description || '')
        setIsPublic(bookmark.visibility === 'public')
        setIsArchived(bookmark.status === 'archived')
        setSelectedTags(bookmark.bookmark_tags?.map((bt: any) => bt.tag_id) || [])

        const { data: tags } = await supabase
          .from('tags')
          .select('id, name')
          .eq('visibility', 'public')
          .eq('status', 'active')
          .order('name')
        
        if (mountedRef.current && tags) setAvailableTags(tags)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        if (mountedRef.current) setError('Failed to load bookmark')
      } finally {
        if (mountedRef.current) setInitialLoading(false)
      }
    }

    if (!authLoading) {
      init()
    }
    
    return () => { mountedRef.current = false }
  }, [bookmarkId, user, authLoading, supabase, router])

  useEffect(() => {
    fetchedRef.current = false
  }, [bookmarkId])

  const handleAddCustomTag = () => {
    const trimmedTag = newTagName.trim()
    if (!trimmedTag) return
    
    // Check if tag already exists in available tags
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
    if (!user) return
    setError(null)
    setLoading(true)

    try { new URL(url) } catch { setError('Please enter a valid URL'); setLoading(false); return }

    const { error: updateError } = await supabase
      .from('bookmarks')
      .update({ url, title, description: description || null, visibility: isPublic ? 'public' : 'private' })
      .eq('id', bookmarkId)

    if (updateError) { setError(updateError.message); setLoading(false); return }

    // Update existing tags
    await supabase.from('bookmark_tags').delete().eq('bookmark_id', bookmarkId)
    if (selectedTags.length > 0) {
      await supabase.from('bookmark_tags').insert(selectedTags.map(tagId => ({ bookmark_id: bookmarkId, tag_id: tagId })))
    }

    // Create tag requests for custom tags (require admin approval)
    if (customTags.length > 0) {
      for (const tagName of customTags) {
        await supabase.from('tag_requests').insert({
          tag_name: tagName,
          bookmark_id: bookmarkId,
          requested_by: user.id,
          status: 'pending',
        })
      }
      setPendingTagsSubmitted(true)
    }
    
    router.push(`/bookmark/${bookmarkId}`)
  }

  const handleArchiveToggle = async () => {
    if (!user) return
    setArchiving(true)
    setError(null)

    const newStatus = isArchived ? 'active' : 'archived'
    
    const { error: updateError } = await supabase
      .from('bookmarks')
      .update({ status: newStatus })
      .eq('id', bookmarkId)

    if (updateError) {
      setError(updateError.message)
      setArchiving(false)
      return
    }

    setIsArchived(!isArchived)
    setArchiving(false)
    
    // Redirect to bookmark page after archiving/unarchiving
    router.push(`/bookmark/${bookmarkId}`)
  }

  const toggleTag = (tagId: string) => setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId])

  if (authLoading || initialLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /><span>Loading...</span></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <BookmarkIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sign in required</h1>
          <p className="text-gray-600 mb-4">Please sign in to edit bookmarks.</p>
          <Link href={`/login?redirect=/bookmarks/${bookmarkId}/edit`} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <BookmarkIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Bookmark not found</h1>
          <p className="text-gray-600 mb-4">This bookmark doesn&apos;t exist or has been deleted.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
            <ArrowLeft className="h-4 w-4" />Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (permissionDenied) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <BookmarkIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Permission denied</h1>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to edit this bookmark.</p>
          <Link href={`/bookmark/${bookmarkId}`} className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
            <ArrowLeft className="h-4 w-4" />Back to Bookmark
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 px-4 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <Link href={`/bookmark/${bookmarkId}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to Bookmark
        </Link>

        <div className="text-center mb-8">
          <BookmarkIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Edit Bookmark</h1>
        </div>

        {/* Archived banner */}
        {isArchived && (
          <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
            <Archive className="h-5 w-5" />
            <span>This bookmark is archived. Restore it to make it visible again.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <div>
            <label htmlFor="url" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><LinkIcon className="h-4 w-4" />URL *</label>
            <input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} required disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-50 transition-colors" />
          </div>

          <div>
            <label htmlFor="title" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><FileText className="h-4 w-4" />Title *</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-50 transition-colors" />
          </div>

          <div>
            <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><FileText className="h-4 w-4" />Description</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none disabled:bg-gray-50 transition-colors" />
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
                <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  New tags (pending admin approval):
                </p>
                <div className="flex flex-wrap gap-2">
                  {customTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomTag(tag)}
                        className="hover:text-amber-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 mb-2">Or suggest a new tag:</p>
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
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">New tags require admin approval before being added</p>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-colors hover:bg-gray-50" style={{ borderColor: isPublic ? 'rgb(13, 148, 136)' : 'rgb(229, 231, 235)' }}>
                <input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} disabled={loading} className="text-primary-600 focus:ring-primary-500" />
                <Globe className={`h-4 w-4 ${isPublic ? 'text-primary-600' : 'text-gray-400'}`} />
                <div>
                  <span className="text-sm font-medium text-gray-700">Public</span>
                  <p className="text-xs text-gray-500">Everyone can see this bookmark</p>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-colors hover:bg-gray-50" style={{ borderColor: !isPublic ? 'rgb(13, 148, 136)' : 'rgb(229, 231, 235)' }}>
                <input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} disabled={loading} className="text-primary-600 focus:ring-primary-500" />
                <Lock className={`h-4 w-4 ${!isPublic ? 'text-primary-600' : 'text-gray-400'}`} />
                <div>
                  <span className="text-sm font-medium text-gray-700">Only Me</span>
                  <p className="text-xs text-gray-500">Only you can see this bookmark</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading || archiving}
              className="flex-1 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-70 transition-all flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" />Saving...</> : <><Save className="h-5 w-5" />Save Changes</>}
            </button>
            <Link href={`/bookmark/${bookmarkId}`} className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancel</Link>
          </div>
        </form>

        {/* Archive Section */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isArchived ? 'Restore Bookmark' : 'Archive Bookmark'}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {isArchived 
              ? 'Restoring this bookmark will make it visible again in browse and search results.'
              : 'Archiving this bookmark will hide it from browse and search results. You can restore it later.'}
          </p>
          <button
            type="button"
            onClick={handleArchiveToggle}
            disabled={loading || archiving}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-70 ${
              isArchived 
                ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            {archiving ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{isArchived ? 'Restoring...' : 'Archiving...'}</>
            ) : isArchived ? (
              <><RotateCcw className="h-4 w-4" />Restore Bookmark</>
            ) : (
              <><Archive className="h-4 w-4" />Archive Bookmark</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
