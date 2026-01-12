'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { BookmarkIcon, Link as LinkIcon, FileText, Tag, Globe, ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'

interface TagType {
  id: string
  name: string
}

export default function EditBookmarkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: bookmarkId } = React.use(params)
  const { user, loading: authLoading } = useAuth()
  
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<TagType[]>([])
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const mountedRef = useRef(true)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    mountedRef.current = true
    
    const init = async () => {
      if (!user) return

      try {
        const { data: bookmark, error: bookmarkError } = await supabase
          .from('bookmarks')
          .select('*, bookmark_tags (tag_id)')
          .eq('id', bookmarkId)
          .eq('creator_id', user.id)
          .single()

        if (!mountedRef.current) return

        if (bookmarkError || !bookmark) {
          setNotFound(true)
          setInitialLoading(false)
          return
        }

        setUrl(bookmark.url)
        setTitle(bookmark.title)
        setDescription(bookmark.description || '')
        setIsPublic(bookmark.visibility === 'public')
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

    if (!authLoading && user) init()
    else if (!authLoading && !user) setInitialLoading(false)
    
    return () => { mountedRef.current = false }
  }, [bookmarkId, user, authLoading, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(null)
    setLoading(true)

    try { new URL(url) } catch { setError('Please enter a valid URL'); setLoading(false); return }

    const { error: updateError } = await supabase
      .from('bookmarks')
      .update({ url, title, description: description || null, visibility: isPublic ? 'public' : 'restricted' })
      .eq('id', bookmarkId)

    if (updateError) { setError(updateError.message); setLoading(false); return }

    await supabase.from('bookmark_tags').delete().eq('bookmark_id', bookmarkId)
    if (selectedTags.length > 0) {
      await supabase.from('bookmark_tags').insert(selectedTags.map(tagId => ({ bookmark_id: bookmarkId, tag_id: tagId })))
    }
    router.push('/bookmarks')
  }

  const toggleTag = (tagId: string) => setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId])

  if (authLoading || initialLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /><span>Loading...</span></div>
      </div>
    )
  }

  if (!user) return null

  if (notFound) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <BookmarkIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Bookmark not found</h1>
          <p className="text-gray-600 mb-4">This bookmark doesn't exist or you don't have permission.</p>
          <Link href="/bookmarks" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
            <ArrowLeft className="h-4 w-4" />Back to Bookmarks
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 px-4 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <Link href="/bookmarks" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to Bookmarks
        </Link>

        <div className="text-center mb-8">
          <BookmarkIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Edit Bookmark</h1>
        </div>

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

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Tag className="h-4 w-4" />Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} disabled={loading}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${selectedTags.includes(tag.id) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50`}>
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Globe className="h-4 w-4" />Visibility</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} disabled={loading} className="text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-gray-700">Public</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} disabled={loading} className="text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-gray-700">Restricted</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-70 transition-all flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" />Saving...</> : <><Save className="h-5 w-5" />Save Changes</>}
            </button>
            <Link href="/bookmarks" className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
