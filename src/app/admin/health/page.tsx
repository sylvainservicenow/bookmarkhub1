'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  ExternalLink,
  Copy,
  Loader2,
  Play,
  FileWarning,
  XCircle
} from 'lucide-react'

interface HealthStats {
  total: number
  healthy: number
  warning1: number
  warning2: number
  warning3: number
  submitted: number
  checked: number
  archived: number
  neverChecked: number
  duplicates: number
}

interface BookmarkHealth {
  id: string
  title: string
  url: string
  status: string
  failure_count: number
  last_health_check: string | null
  health_check_notes: string | null
}

export default function AdminHealthPage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'
  
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [stats, setStats] = useState<HealthStats | null>(null)
  const [bookmarks, setBookmarks] = useState<BookmarkHealth[]>([])
  const [filter, setFilter] = useState<string>('all-issues')
  const [loading, setLoading] = useState(true)
  const [runningCheck, setRunningCheck] = useState(false)
  const [checkingId, setCheckingId] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  const fetchData = async () => {
    if (!user?.id) return
    
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

    // Fetch stats
    const [total, healthy, warning1, warning2, warning3, submitted, checked, archived, neverChecked, duplicates] = await Promise.all([
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }),
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('failure_count', 0),
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('status', 'health_warning_1'),
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('status', 'health_warning_2'),
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('status', 'health_warning_3'),
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('status', 'checked'),
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }).is('last_health_check', null).in('status', ['active', 'checked']),
      supabase.from('duplicate_candidates').select('*', { count: 'exact', head: true }).eq('reviewed', false),
    ])

    setStats({
      total: total.count || 0,
      healthy: healthy.count || 0,
      warning1: warning1.count || 0,
      warning2: warning2.count || 0,
      warning3: warning3.count || 0,
      submitted: submitted.count || 0,
      checked: checked.count || 0,
      archived: archived.count || 0,
      neverChecked: neverChecked.count || 0,
      duplicates: duplicates.count || 0,
    })

    // Fetch bookmarks based on filter
    let query = supabase
      .from('bookmarks')
      .select('id, title, url, status, failure_count, last_health_check, health_check_notes')
      .order('last_health_check', { ascending: true, nullsFirst: true })
    
    if (filter === 'all-issues') {
      query = query.in('status', ['health_warning_1', 'health_warning_2', 'health_warning_3', 'submitted', 'needs_fixing'])
    } else if (filter === 'critical') {
      query = query.eq('status', 'health_warning_3')
    } else if (filter === 'warnings') {
      query = query.in('status', ['health_warning_1', 'health_warning_2'])
    } else if (filter === 'submitted') {
      query = query.eq('status', 'submitted')
    } else if (filter === 'never-checked') {
      query = query.is('last_health_check', null).in('status', ['active', 'checked'])
    }
    
    const { data: bookmarksData } = await query.limit(100)
    setBookmarks(bookmarksData || [])
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [user?.id, authLoading, filter])

  const runFullHealthCheck = async () => {
    setRunningCheck(true)
    try {
      const res = await fetch('/api/cron/health-check', {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      const data = await res.json()
      alert(`Health check completed!\n\nChecked: ${data.results?.checked || 0}\nHealthy: ${data.results?.healthy || 0}\nFailed: ${data.results?.failed || 0}\nDuplicates found: ${data.results?.duplicatesFound || 0}`)
      fetchData()
    } catch (error) {
      alert('Failed to run health check')
    }
    setRunningCheck(false)
  }

  const checkSingleBookmark = async (bookmarkId: string) => {
    setCheckingId(bookmarkId)
    try {
      const res = await fetch('/api/admin/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkId }),
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      } else {
        alert(`Check failed: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to check bookmark')
    }
    setCheckingId(null)
  }

  const updateStatus = async (bookmarkId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/bookmark-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkId, status: newStatus }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      alert('Failed to update status')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading health dashboard...</span>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200'
      case 'checked': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'submitted': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'health_warning_1': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'health_warning_2': return 'bg-orange-200 text-orange-800 border-orange-300'
      case 'health_warning_3': return 'bg-red-100 text-red-700 border-red-200'
      case 'archived': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'checked': return <CheckCircle2 className="h-4 w-4" />
      case 'submitted': return <Clock className="h-4 w-4" />
      case 'health_warning_1':
      case 'health_warning_2': return <AlertTriangle className="h-4 w-4" />
      case 'health_warning_3': return <XCircle className="h-4 w-4" />
      default: return <FileWarning className="h-4 w-4" />
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
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
            <div className="p-2 bg-primary-100 rounded-lg">
              <Activity className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Health Dashboard</h1>
              <p className="text-gray-600">Monitor bookmark health and review new submissions</p>
            </div>
          </div>
          
          <button
            onClick={runFullHealthCheck}
            disabled={runningCheck}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {runningCheck ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run Health Check
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Bookmarks</div>
          </div>
          <div className="bg-white border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.healthy}</div>
            <div className="text-sm text-gray-500">Healthy</div>
          </div>
          <div className="bg-white border border-yellow-200 rounded-lg p-4 cursor-pointer hover:bg-yellow-50" onClick={() => setFilter('submitted')}>
            <div className="text-2xl font-bold text-yellow-600">{stats.submitted}</div>
            <div className="text-sm text-gray-500">Pending Review</div>
          </div>
          <div className="bg-white border border-orange-200 rounded-lg p-4 cursor-pointer hover:bg-orange-50" onClick={() => setFilter('warnings')}>
            <div className="text-2xl font-bold text-orange-600">{stats.warning1 + stats.warning2}</div>
            <div className="text-sm text-gray-500">Warnings</div>
          </div>
          <div className="bg-white border border-red-200 rounded-lg p-4 cursor-pointer hover:bg-red-50" onClick={() => setFilter('critical')}>
            <div className="text-2xl font-bold text-red-600">{stats.warning3}</div>
            <div className="text-sm text-gray-500">Critical</div>
          </div>
        </div>
      )}

      {/* Secondary Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-lg font-semibold text-blue-600">{stats.checked}</div>
            <div className="text-xs text-gray-500">Checked by Admin</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-lg font-semibold text-gray-600">{stats.archived}</div>
            <div className="text-xs text-gray-500">Archived</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50" onClick={() => setFilter('never-checked')}>
            <div className="text-lg font-semibold text-purple-600">{stats.neverChecked}</div>
            <div className="text-xs text-gray-500">Never Checked</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-lg font-semibold text-pink-600">{stats.duplicates}</div>
            <div className="text-xs text-gray-500">Potential Duplicates</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'all-issues', label: 'All Issues' },
          { key: 'critical', label: 'Critical' },
          { key: 'warnings', label: 'Warnings' },
          { key: 'submitted', label: 'Pending Review' },
          { key: 'never-checked', label: 'Never Checked' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bookmarks Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Bookmark</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Last Check</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookmarks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No bookmarks matching this filter
                </td>
              </tr>
            ) : (
              bookmarks.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="max-w-md">
                      <Link
                        href={`/bookmark/${b.id}`}
                        className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
                      >
                        {b.title}
                      </Link>
                      <div className="text-xs text-gray-500 truncate">{b.url}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(b.status)}`}>
                      {getStatusIcon(b.status)}
                      {b.status.replace(/_/g, ' ')}
                    </span>
                    {b.failure_count > 0 && (
                      <div className="text-xs text-gray-500 mt-1">Failures: {b.failure_count}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {b.last_health_check
                      ? new Date(b.last_health_check).toLocaleString()
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => checkSingleBookmark(b.id)}
                        disabled={checkingId === b.id}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded disabled:opacity-50"
                        title="Check now"
                      >
                        {checkingId === b.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </button>
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                        title="Open URL"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      {b.status === 'submitted' && (
                        <button
                          onClick={() => updateStatus(b.id, 'checked')}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Approve
                        </button>
                      )}
                      {b.status.startsWith('health_warning') && (
                        <button
                          onClick={() => updateStatus(b.id, 'active')}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Mark OK
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(b.id, 'archived')}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
