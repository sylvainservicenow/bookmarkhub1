'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import Link from 'next/link'
import { ArrowLeft, Bookmark, ExternalLink, Pencil, Loader2, Search, Filter, Eye } from 'lucide-react'
import { BookmarkStatusSelect } from '@/components/admin/BookmarkStatusSelect'

interface BookmarkData {
  id: string
  title: string
  url: string
  visibility: string
  status: string
  failure_count: number
  last_health_check: string | null
  created_at: string
  updated_at: string
  click_count: number
  users: { name: string | null; email: string } | null
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'checked', label: 'Checked' },
  { value: 'health_warning_1', label: 'Warning 1' },
  { value: 'health_warning_2', label: 'Warning 2' },
  { value: 'health_warning_3', label: 'Warning 3' },
  { value: 'needs_fixing', label: 'Needs Fixing' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'archived', label: 'Archived' },
]

function AdminBookmarksContent() {
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'
  
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [supabase] = useState(() => createClient())
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlStatus = searchParams.get('status')
    if (urlStatus) setStatusFilter(urlStatus)
  }, [searchParams])

  useEffect(() => {
    if (authLoading) return
    if (!user?.id) { router.push('/dashboard'); return }

    const fetchData = async () => {
      setLoading(true)
      const { data: profileData } = await supabase.from('users').select('role').eq('id', user.id).single()
      setProfile(profileData)
      if (profileData?.role !== 'admin') { router.push('/dashboard'); return }

      let query = supabase
        .from('bookmarks')
        .select('id, title, url, visibility, status, failure_count, last_health_check, created_at, updated_at, click_count, users:creator_id (name, email)')
        .order('updated_at', { ascending: false })
      
      if (statusFilter !== 'all') query = query.eq('status', statusFilter)
      if (searchQuery) query = query.or(`title.ilike.%${searchQuery}%,url.ilike.%${searchQuery}%`)
      
      const { data } = await query.limit(200)
      setBookmarks(data || [])
      setLoading(false)
    }
    fetchData()
  }, [user?.id, authLoading, statusFilter, searchQuery, supabase, router])

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    const params = new URLSearchParams(searchParams.toString())
    value === 'all' ? params.delete('status') : params.set('status', value)
    router.push(`/admin/bookmarks?${params.toString()}`, { scroll: false })
  }

  if (authLoading || (loading && !bookmarks.length)) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" /><span>Loading bookmarks...</span>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') return null

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />Back to Admin
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg"><Bookmark className="h-6 w-6 text-primary-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Bookmarks</h1>
            <p className="text-gray-600">{bookmarks.length} bookmarks{statusFilter !== 'all' && ' (filtered)'}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search by title or URL..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select value={statusFilter} onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
            {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.slice(1).map((f) => (
          <button key={f.value} onClick={() => handleStatusFilterChange(f.value)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${statusFilter === f.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Creator</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Visibility</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Health</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    <span>Views</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Updated</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookmarks.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No bookmarks found</td></tr>
              ) : bookmarks.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/bookmark/${b.id}`} className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1 block max-w-xs">{b.title}</Link>
                    <span className="text-xs text-gray-400 truncate block max-w-xs">{b.url}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{b.users?.name || b.users?.email?.split('@')[0] || 'Unknown'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${b.visibility === 'public' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.visibility}</span>
                  </td>
                  <td className="px-4 py-3"><BookmarkStatusSelect bookmarkId={b.id} currentStatus={b.status} /></td>
                  <td className="px-4 py-3">
                    {b.failure_count > 0 ? <span className="text-xs text-red-600">{b.failure_count} failures</span>
                      : b.last_health_check ? <span className="text-xs text-green-600">OK</span>
                      : <span className="text-xs text-gray-400">Not checked</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    <span className="flex items-center gap-1">
                      {b.click_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{new Date(b.updated_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/bookmarks/${b.id}/edit`} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded" title="Edit"><Pencil className="h-4 w-4" /></Link>
                      <a href={b.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded" title="Open"><ExternalLink className="h-4 w-4" /></a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function AdminBookmarksPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)] flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>}>
      <AdminBookmarksContent />
    </Suspense>
  )
}
