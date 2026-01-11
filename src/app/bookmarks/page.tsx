'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Bookmark, ArrowLeft, Plus, Archive, CheckSquare, Square, 
  Loader2, Filter, ArrowUpDown, Clock, Eye, EyeOff, RotateCcw,
  CheckCircle
} from 'lucide-react'
import { BookmarkFavicon } from '@/components/bookmarks/BookmarkFavicon'

type BookmarkStatus = 'active' | 'archived' | 'pending'
type SortField = 'created_at' | 'title' | 'url'
type SortOrder = 'asc' | 'desc'

interface BookmarkType {
  id: string
  title: string
  url: string
  description: string | null
  status: string
  visibility: string
  created_at: string
  favicon_url: string | null
  bookmark_tags: { tags: { id: string; name: string } | null }[]
}

export default function MyBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showArchived, setShowArchived] = useState(false)
  const [showPending, setShowPending] = useState(false)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const mountedRef = useRef(true)
  
  const router = useRouter()
  const supabase = createClient()

  const fetchBookmarks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!mountedRef.current) return
      
      if (!user) {
        router.push('/login?redirect=/bookmarks')
        return
      }

      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          id,
          title,
          url,
          description,
          status,
          visibility,
          created_at,
          favicon_url,
          bookmark_tags (
            tags (id, name)
          )
        `)
        .eq('creator_id', user.id)
        .order(sortField, { ascending: sortOrder === 'asc' })

      if (!mountedRef.current) return

      if (!error && data) {
        setBookmarks(data as BookmarkType[])
      }
    } catch (err) {
      // Silently handle AbortError
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      console.error('Error fetching bookmarks:', err)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true
    fetchBookmarks()
    
    return () => {
      mountedRef.current = false
    }
  }, [sortField, sortOrder])

  // Filter and group bookmarks
  const { activeBookmarks, archivedBookmarks, pendingBookmarks } = useMemo(() => {
    const active = bookmarks.filter(b => b.status === 'active')
    const archived = bookmarks.filter(b => b.status === 'archived')
    const pending = bookmarks.filter(b => b.status === 'pending')
    return { activeBookmarks: active, archivedBookmarks: archived, pendingBookmarks: pending }
  }, [bookmarks])

  // Get visible bookmarks based on filters
  const visibleBookmarks = useMemo(() => {
    let result = [...activeBookmarks]
    if (showPending) result = [...result, ...pendingBookmarks]
    if (showArchived) result = [...result, ...archivedBookmarks]
    return result
  }, [activeBookmarks, archivedBookmarks, pendingBookmarks, showArchived, showPending])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleBookmarks.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleBookmarks.map(b => b.id)))
    }
  }

  const showFeedback = (message: string) => {
    setActionFeedback(message)
    setTimeout(() => setActionFeedback(null), 3000)
  }

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return
    setBulkActionLoading(true)

    const { error } = await supabase
      .from('bookmarks')
      .update({ status: 'archived' })
      .in('id', Array.from(selectedIds))

    if (!error) {
      showFeedback(`${selectedIds.size} bookmark(s) archived`)
      setSelectedIds(new Set())
      await fetchBookmarks()
    }
    setBulkActionLoading(false)
  }

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return
    setBulkActionLoading(true)

    const { error } = await supabase
      .from('bookmarks')
      .update({ status: 'active' })
      .in('id', Array.from(selectedIds))

    if (!error) {
      showFeedback(`${selectedIds.size} bookmark(s) restored`)
      setSelectedIds(new Set())
      await fetchBookmarks()
    }
    setBulkActionLoading(false)
  }

  const handleSingleArchive = async (id: string) => {
    const { error } = await supabase
      .from('bookmarks')
      .update({ status: 'archived' })
      .eq('id', id)

    if (!error) {
      showFeedback('Bookmark archived')
      await fetchBookmarks()
    }
  }

  const handleSingleRestore = async (id: string) => {
    const { error } = await supabase
      .from('bookmarks')
      .update({ status: 'active' })
      .eq('id', id)

    if (!error) {
      showFeedback('Bookmark restored')
      await fetchBookmarks()
    }
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading bookmarks...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle className="h-4 w-4" />
          {actionFeedback}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Bookmark className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Bookmarks</h1>
              <p className="text-gray-600">
                {activeBookmarks.length} active
                {pendingBookmarks.length > 0 && ` · ${pendingBookmarks.length} pending`}
                {archivedBookmarks.length > 0 && ` · ${archivedBookmarks.length} archived`}
              </p>
            </div>
          </div>
          
          <Link
            href="/submit"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add New
          </Link>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filter toggles */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Filter className="h-4 w-4" />
              Show:
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPending}
                onChange={() => setShowPending(!showPending)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Pending ({pendingBookmarks.length})
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={() => setShowArchived(!showArchived)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Archive className="h-3.5 w-3.5 text-gray-400" />
                Archived ({archivedBookmarks.length})
              </span>
            </label>
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <ArrowUpDown className="h-4 w-4" />
              Sort:
            </span>
            <button
              onClick={() => toggleSort('created_at')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                sortField === 'created_at' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Date {sortField === 'created_at' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => toggleSort('title')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                sortField === 'title' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Title {sortField === 'title' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 animate-fade-in">
            <span className="text-sm text-gray-600">
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleBulkArchive}
              disabled={bulkActionLoading}
              className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {bulkActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
              Archive Selected
            </button>
            <button
              onClick={handleBulkRestore}
              disabled={bulkActionLoading}
              className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {bulkActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              Restore Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Bookmarks Table */}
      {visibleBookmarks.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[auto,1fr,auto,auto] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
            <div className="flex items-center">
              <button
                onClick={toggleSelectAll}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {selectedIds.size === visibleBookmarks.length ? (
                  <CheckSquare className="h-5 w-5 text-primary-600" />
                ) : (
                  <Square className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            <div>Bookmark</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {visibleBookmarks.map((bookmark) => (
              <div 
                key={bookmark.id} 
                className={`grid grid-cols-[auto,1fr,auto,auto] gap-4 px-4 py-3 items-center transition-colors ${
                  selectedIds.has(bookmark.id) ? 'bg-primary-50' : 'hover:bg-gray-50'
                } ${bookmark.status === 'archived' ? 'opacity-60' : ''}`}
              >
                {/* Checkbox */}
                <div>
                  <button
                    onClick={() => toggleSelect(bookmark.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {selectedIds.has(bookmark.id) ? (
                      <CheckSquare className="h-5 w-5 text-primary-600" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Bookmark Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <BookmarkFavicon 
                      faviconUrl={bookmark.favicon_url} 
                      title={bookmark.title} 
                      size="sm" 
                    />
                    <Link
                      href={`/bookmark/${bookmark.id}`}
                      className="font-medium text-gray-900 hover:text-primary-600 truncate transition-colors"
                    >
                      {bookmark.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 truncate max-w-[300px]">
                      {bookmark.url}
                    </span>
                    {bookmark.bookmark_tags?.slice(0, 3).map((bt) => bt.tags && (
                      <span key={bt.tags.id} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {bt.tags.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {bookmark.status === 'active' && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Active
                    </span>
                  )}
                  {bookmark.status === 'pending' && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                  {bookmark.status === 'archived' && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />
                      Archived
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/bookmarks/${bookmark.id}/edit`}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </Link>
                  {bookmark.status === 'archived' ? (
                    <button
                      onClick={() => handleSingleRestore(bookmark.id)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSingleArchive(bookmark.id)}
                      className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors flex items-center gap-1"
                    >
                      <Archive className="h-3 w-3" />
                      Archive
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No bookmarks yet</h2>
          <p className="text-gray-600 mb-4">
            Start sharing useful links with the community!
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Submit Your First Bookmark
          </Link>
        </div>
      )}
    </div>
  )
}
