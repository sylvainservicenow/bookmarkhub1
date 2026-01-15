'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Tag, 
  Loader2, 
  Calendar, 
  User, 
  Archive, 
  Trash2, 
  RotateCcw, 
  ExternalLink,
  BookmarkIcon,
  AlertCircle,
  X,
  Edit,
  Eye,
  Globe
} from 'lucide-react'

interface TagDetails {
  id: string
  name: string
  visibility: string
  status: string
  created_at: string
  updated_at: string
  created_by: string | null
  creator?: {
    name: string
    email: string
  } | null
}

interface LinkedBookmark {
  id: string
  title: string
  url: string
  status: string
  visibility: string
  created_at: string
  click_count: number
}

export default function AdminTagDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: tagId } = use(params)
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'
  
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [tag, setTag] = useState<TagDetails | null>(null)
  const [bookmarks, setBookmarks] = useState<LinkedBookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [supabase] = useState(() => createClient())
  const router = useRouter()
  
  // Action states
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  
  // Edit name state
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    
    if (!user?.id) {
      router.push(`/login?redirect=/admin/tags/${tagId}`)
      return
    }

    const fetchData = async () => {
      // Check admin role
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

      // Fetch tag details
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('*')
        .eq('id', tagId)
        .single()

      if (tagError || !tagData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      // Fetch creator info if exists
      if (tagData.created_by) {
        const { data: creatorData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', tagData.created_by)
          .single()
        
        tagData.creator = creatorData
      }

      setTag(tagData)
      setEditedName(tagData.name)

      // Fetch linked bookmarks
      const { data: bookmarkTagsData } = await supabase
        .from('bookmark_tags')
        .select('bookmark_id')
        .eq('tag_id', tagId)

      if (bookmarkTagsData && bookmarkTagsData.length > 0) {
        const bookmarkIds = bookmarkTagsData.map(bt => bt.bookmark_id)
        
        const { data: bookmarksData } = await supabase
          .from('bookmarks')
          .select('id, title, url, status, visibility, created_at, click_count')
          .in('id', bookmarkIds)
          .order('title')
        
        if (bookmarksData) {
          setBookmarks(bookmarksData)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [user?.id, authLoading, tagId, router, supabase])

  const handleArchiveToggle = async () => {
    if (!tag) return
    setActionLoading(true)

    const newStatus = tag.status === 'archived' ? 'active' : 'archived'
    
    const { error } = await supabase
      .from('tags')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', tagId)

    if (error) {
      alert('Failed to update tag status')
    } else {
      setTag({ ...tag, status: newStatus })
    }
    
    setActionLoading(false)
  }

  const handleDelete = async () => {
    if (!tag) return
    setActionLoading(true)
    setDeleteError(null)

    try {
      // Delete all bookmark_tags associations
      const { error: linkError } = await supabase
        .from('bookmark_tags')
        .delete()
        .eq('tag_id', tagId)

      if (linkError) {
        throw new Error('Failed to remove tag associations')
      }

      // Delete the tag
      const { error: tagError } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)

      if (tagError) {
        throw new Error('Failed to delete tag')
      }

      router.push('/admin/tags')
    } catch (err: any) {
      setDeleteError(err.message)
      setActionLoading(false)
    }
  }

  const handleSaveName = async () => {
    if (!tag || !editedName.trim()) return
    
    if (editedName.trim() === tag.name) {
      setIsEditingName(false)
      return
    }

    setSaveLoading(true)
    setSaveError(null)

    const { error } = await supabase
      .from('tags')
      .update({ 
        name: editedName.trim(), 
        updated_at: new Date().toISOString() 
      })
      .eq('id', tagId)

    if (error) {
      setSaveError(error.message)
    } else {
      setTag({ ...tag, name: editedName.trim() })
      setIsEditingName(false)
    }

    setSaveLoading(false)
  }

  const handleRemoveBookmarkTag = async (bookmarkId: string) => {
    const { error } = await supabase
      .from('bookmark_tags')
      .delete()
      .eq('tag_id', tagId)
      .eq('bookmark_id', bookmarkId)

    if (error) {
      alert('Failed to remove tag from bookmark')
    } else {
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
    }
  }

  if (authLoading || loading) {
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

  if (notFound) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Tag not found</h1>
          <p className="text-gray-600 mb-4">This tag doesn&apos;t exist or has been deleted.</p>
          <Link href="/admin/tags" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
            <ArrowLeft className="h-4 w-4" />Back to Tags
          </Link>
        </div>
      </div>
    )
  }

  if (!tag) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/tags"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tags
        </Link>
      </div>

      {/* Tag Info Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${tag.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Tag className={`h-8 w-8 ${tag.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl font-bold text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saveLoading}
                    className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saveLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false)
                      setEditedName(tag.name)
                      setSaveError(null)
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{tag.name}</h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Edit name"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              )}
              {saveError && (
                <p className="text-red-600 text-sm mt-1">{saveError}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  tag.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tag.status}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                  tag.visibility === 'public' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  <Globe className="h-3 w-3" />
                  {tag.visibility}
                </span>
                <span className="text-gray-500 text-sm">
                  {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Meta Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4 text-gray-400" />
            <span>Created by:</span>
            <span className="font-medium text-gray-900">
              {tag.creator?.name || tag.creator?.email || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>Created:</span>
            <span className="font-medium text-gray-900">
              {new Date(tag.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          {tag.updated_at && tag.updated_at !== tag.created_at && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Last updated:</span>
              <span className="font-medium text-gray-900">
                {new Date(tag.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleArchiveToggle}
            disabled={actionLoading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              tag.status === 'archived'
                ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            {tag.status === 'archived' ? (
              <><RotateCcw className="h-4 w-4" />Reactivate Tag</>
            ) : (
              <><Archive className="h-4 w-4" />Archive Tag</>
            )}
          </button>
          <button
            onClick={() => setDeleteModal(true)}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete Tag
          </button>
        </div>
      </div>

      {/* Linked Bookmarks */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <BookmarkIcon className="h-5 w-5 text-gray-600" />
            Linked Bookmarks ({bookmarks.length})
          </h2>
        </div>
        
        {bookmarks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <BookmarkIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No bookmarks are using this tag</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/bookmark/${bookmark.id}`}
                        className="font-medium text-gray-900 hover:text-primary-600 truncate"
                      >
                        {bookmark.title}
                      </Link>
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <p className="text-sm text-gray-500 truncate mb-2">{bookmark.url}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full ${
                        bookmark.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : bookmark.status === 'archived'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-amber-100 text-amber-700'
                      }`}>
                        {bookmark.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        bookmark.visibility === 'public'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {bookmark.visibility}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Eye className="h-3 w-3" />
                        {bookmark.click_count} views
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveBookmarkTag(bookmark.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Remove tag from this bookmark"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Delete Tag
              </h3>
              <button
                onClick={() => setDeleteModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete the tag <strong>&quot;{tag.name}&quot;</strong>?
            </p>
            
            {bookmarks.length > 0 && (
              <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                This tag is used by <strong>{bookmarks.length}</strong> bookmark(s). 
                Deleting it will remove the tag from all associated bookmarks.
              </div>
            )}

            {deleteError && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Tag
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
