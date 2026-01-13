'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import Link from 'next/link'
import { ArrowLeft, Users, Bookmark, Tag, Shield, CheckSquare, Upload, Loader2, AlertTriangle } from 'lucide-react'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'
  
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [stats, setStats] = useState({
    userCount: 0,
    bookmarkCount: 0,
    tagCount: 0,
    unresolvedErrors: 0,
  })
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    
    if (!user?.id) {
      router.push('/dashboard')
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

      const [
        { count: userCount },
        { count: bookmarkCount },
        { count: tagCount },
        { count: unresolvedErrorCount },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('bookmarks').select('*', { count: 'exact', head: true }),
        supabase.from('tags').select('*', { count: 'exact', head: true }),
        supabase.from('client_errors').select('*', { count: 'exact', head: true }).eq('resolved', false),
      ])

      setStats({
        userCount: userCount || 0,
        bookmarkCount: bookmarkCount || 0,
        tagCount: tagCount || 0,
        unresolvedErrors: unresolvedErrorCount || 0,
      })
      setLoading(false)
    }

    fetchData()
  }, [user?.id, authLoading, router, supabase])

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading admin panel...</span>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm sm:text-base text-gray-600 truncate">Manage users, bookmarks, and tags</p>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="space-y-3 mb-6 sm:mb-8">
        {stats.unresolvedErrors > 0 && (
          <Link
            href="/admin/errors"
            className="block p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-1.5 sm:p-2 bg-red-200 rounded-full flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-700" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-red-900 text-sm sm:text-base">Client Errors</h2>
                  <p className="text-xs sm:text-sm text-red-700 truncate">
                    {stats.unresolvedErrors} unresolved error{stats.unresolvedErrors !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <span className="text-red-600 font-medium text-sm sm:text-base whitespace-nowrap flex-shrink-0">View →</span>
            </div>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <Link href="/admin/users" className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-300 hover:shadow-sm transition-all">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mb-1 sm:mb-2" />
          <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.userCount}</div>
          <div className="text-xs sm:text-sm text-gray-500">Users</div>
        </Link>
        <Link href="/admin/bookmarks" className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-primary-300 hover:shadow-sm transition-all">
          <Bookmark className="h-6 w-6 sm:h-8 sm:w-8 text-primary-500 mb-1 sm:mb-2" />
          <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.bookmarkCount}</div>
          <div className="text-xs sm:text-sm text-gray-500">Bookmarks</div>
        </Link>
        <Link href="/admin/tags" className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-green-300 hover:shadow-sm transition-all">
          <Tag className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mb-1 sm:mb-2" />
          <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.tagCount}</div>
          <div className="text-xs sm:text-sm text-gray-500">Tags</div>
        </Link>
        <Link href="/admin/errors" className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-red-300 hover:shadow-sm transition-all">
          <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mb-1 sm:mb-2" />
          <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.unresolvedErrors}</div>
          <div className="text-xs sm:text-sm text-gray-500">Errors</div>
        </Link>
      </div>

      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Management</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
        <Link href="/admin/users" className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-blue-300 hover:shadow-sm transition-all">
          <Users className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 mb-2 sm:mb-4" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Users</h2>
          <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Manage accounts & roles</p>
        </Link>
        <Link href="/admin/bookmarks" className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-primary-300 hover:shadow-sm transition-all">
          <Bookmark className="h-8 w-8 sm:h-10 sm:w-10 text-primary-500 mb-2 sm:mb-4" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Bookmarks</h2>
          <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Edit & moderate links</p>
        </Link>
        <Link href="/admin/tags" className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-green-300 hover:shadow-sm transition-all">
          <Tag className="h-8 w-8 sm:h-10 sm:w-10 text-green-500 mb-2 sm:mb-4" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Tags</h2>
          <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Organize tags</p>
        </Link>
        <Link href="/admin/errors" className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-red-300 hover:shadow-sm transition-all">
          <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-red-500 mb-2 sm:mb-4" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Errors</h2>
          <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Monitor client errors</p>
        </Link>
        <Link href="/admin/import" className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-indigo-300 hover:shadow-sm transition-all">
          <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-500 mb-2 sm:mb-4" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Import</h2>
          <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Bulk import bookmarks</p>
        </Link>
      </div>
    </div>
  )
}
