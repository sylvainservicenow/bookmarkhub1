'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import Link from 'next/link'
import { ArrowLeft, Tag, Plus, Clock, Loader2, Trash2, Archive, AlertCircle, X } from 'lucide-react'
import { TagStatusSelect } from '@/components/admin/TagStatusSelect'
import { CreateTagForm } from '@/components/admin/CreateTagForm'
import { TagRequestsManager } from '@/components/admin/TagRequestsManager'

interface TagWithCount {
  id: string
  name: string
  visibility: string
  status: string
  bookmark_count: number
}

export default function AdminTagsPage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'
  
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())
  const router = useRouter()
  
  // Delete confirmation state
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; tag: TagWithCount | null }>({
    open: false,
    tag: null
  })
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    
    if (!user?.id) {
      router.push('/login?redirect=/admin/tags')
      return
    }

    const fetchData = async () => {
      // Fetch profile to check role
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

      // Get all tags with bookmark count using a separate query
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('id, name, visibility, status')
        .order('name', { ascending: true })

      if (tagsError) {
        console.error('Error fetching tags:', tagsError)
        setLoading(false)
        return
      }

      if (tagsData && tagsData.length > 0) {
        // Get bookmark counts for all tags
        const { data: countsData } = await supabase
          .from('bookmark_tags')
          .select('tag_id')
        
        // Count bookmarks per tag
        const countMap: Record<string, number> = {}
        if (countsData) {
          countsData.forEach((item: { tag_id: string }) => {
            countMap[item.tag_id] = (countMap[item.tag_id] || 0) + 1
          })
        }

        // Merge counts with tags
        const tagsWithCounts = tagsData.map(tag => ({
          ...tag,
          bookmark_count: countMap[tag.id] || 0
        }))

        setTags(tagsWithCounts)
      }

      // Get pending tag requests count
      const { count } = await supabase
        .from('tag_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      setPendingCount(count || 0)
      setLoading(false)
    }

    fetchData()
  }, [user?.id, authLoading, router, supabase])

  const handleDeleteTag = async () => {
    if (!deleteModal.tag) return
    
    setDeleting(true)
    setDeleteError(null)

    try {
      // First, delete all bookmark_tags associations
      const { error: linkError } = await supabase
        .from('bookmark_tags')
        .delete()
        .eq('tag_id', deleteModal.tag.id)

      if (linkError) {
        throw new Error('Failed to remove tag associations: ' + linkError.message)
      }

      // Then delete the tag itself
      const { error: tagError } = await supabase
        .from('tags')
        .delete()
        .eq('id', deleteModal.tag.id)

      if (tagError) {
        throw new Error('Failed to delete tag: ' + tagError.message)
      }

      // Remove from local state
      setTags(prev => prev.filter(t => t.id !== deleteModal.tag!.id))
      setDeleteModal({ open: false, tag: null })
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete tag')
    } finally {
      setDeleting(false)
    }
  }

  const handleArchiveTag = async (tag: TagWithCount) => {
    const newStatus = tag.status === 'archived' ? 'active' : 'archived'
    
    const { error } = await supabase
      .from('tags')
      .update({ status: newStatus })
      .eq('id', tag.id)

    if (error) {
      alert('Failed to update tag status')
      return
    }

    // Update local state
    setTags(prev => prev.map(t => 
      t.id === tag.id ? { ...t, status: newStatus } : t
    ))
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

  const activeTags = tags.filter(t => t.status === 'active')
  const archivedTags = tags.filter(t => t.status === 'archived')

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Tag className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Tags</h1>
              <p className="text-gray-600">{tags.length} total tags ({activeTags.length} active, {archivedTags.length} archived)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Tag Requests Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          Pending Tag Requests
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-sm rounded-full">
              {pendingCount}
            </span>
          )}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Review and approve user-suggested tags. Approved tags will be created and associated with the requesting bookmark.
        </p>
        <TagRequestsManager />
      </div>

      {/* Create Tag Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Tag
        </h2>
        <CreateTagForm />
      </div>

      {/* Active Tags Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Active Tags ({activeTags.length})</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tag Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Usage</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Visibility</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {activeTags.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No active tags
                </td>
              </tr>
            ) : (
              activeTags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {tag.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {tag.bookmark_count} bookmarks
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      tag.visibility === 'public' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {tag.visibility}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleArchiveTag(tag)}
                        className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded inline-flex"
                        title="Archive tag"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, tag })}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded inline-flex"
                        title="Delete tag"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Archived Tags Table */}
      {archivedTags.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Archived Tags ({archivedTags.length})</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tag Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Usage</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Visibility</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {archivedTags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50 bg-gray-50/50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-500">
                      {tag.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {tag.bookmark_count} bookmarks
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                      {tag.visibility}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleArchiveTag(tag)}
                        className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded inline-flex"
                        title="Restore tag"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, tag })}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded inline-flex"
                        title="Delete tag"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.tag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Delete Tag
              </h3>
              <button
                onClick={() => setDeleteModal({ open: false, tag: null })}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete the tag <strong>&quot;{deleteModal.tag.name}&quot;</strong>?
            </p>
            
            {deleteModal.tag.bookmark_count > 0 && (
              <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                This tag is used by <strong>{deleteModal.tag.bookmark_count}</strong> bookmark(s). 
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
                onClick={() => setDeleteModal({ open: false, tag: null })}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTag}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
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
