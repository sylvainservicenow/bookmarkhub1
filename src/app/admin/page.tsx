import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Users, Bookmark, Tag, Shield, Clock, FolderPlus } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?redirect=/admin')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get counts
  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: bookmarkCount } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })

  const { count: tagCount } = await supabase
    .from('tags')
    .select('*', { count: 'exact', head: true })

  const { count: pendingCount } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: pendingGroupRequestsCount } = await supabase
    .from('group_creation_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage users, bookmarks, tags, and groups</p>
          </div>
        </div>
      </div>

      {/* Stats - Now Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Link 
          href="/admin/users"
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <Users className="h-8 w-8 text-blue-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{userCount || 0}</div>
          <div className="text-sm text-gray-500">Total Users</div>
        </Link>
        <Link 
          href="/admin/bookmarks"
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <Bookmark className="h-8 w-8 text-primary-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{bookmarkCount || 0}</div>
          <div className="text-sm text-gray-500">Total Bookmarks</div>
        </Link>
        <Link 
          href="/admin/tags"
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-sm transition-all"
        >
          <Tag className="h-8 w-8 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{tagCount || 0}</div>
          <div className="text-sm text-gray-500">Total Tags</div>
        </Link>
        <Link 
          href="/admin/bookmarks?status=pending"
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-amber-300 hover:shadow-sm transition-all"
        >
          <Clock className="h-8 w-8 text-amber-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{pendingCount || 0}</div>
          <div className="text-sm text-gray-500">Pending Review</div>
        </Link>
        <Link 
          href="/admin/group-requests"
          className={`bg-white border rounded-lg p-4 hover:shadow-sm transition-all ${
            (pendingGroupRequestsCount || 0) > 0 
              ? 'border-purple-300 bg-purple-50 hover:border-purple-400' 
              : 'border-gray-200 hover:border-purple-300'
          }`}
        >
          <FolderPlus className="h-8 w-8 text-purple-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{pendingGroupRequestsCount || 0}</div>
          <div className="text-sm text-gray-500">Group Requests</div>
        </Link>
      </div>

      {/* Admin Sections */}
      <div className="grid md:grid-cols-4 gap-6">
        <Link
          href="/admin/users"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <Users className="h-10 w-10 text-blue-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Manage Users</h2>
          <p className="text-gray-600 text-sm">View, edit roles, and manage user accounts</p>
        </Link>

        <Link
          href="/admin/bookmarks"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <Bookmark className="h-10 w-10 text-primary-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Manage Bookmarks</h2>
          <p className="text-gray-600 text-sm">Review, approve, and moderate bookmarks</p>
        </Link>

        <Link
          href="/admin/tags"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:shadow-sm transition-all"
        >
          <Tag className="h-10 w-10 text-green-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Manage Tags</h2>
          <p className="text-gray-600 text-sm">Create, edit, and organize tags</p>
        </Link>

        <Link
          href="/admin/group-requests"
          className={`bg-white border rounded-lg p-6 hover:shadow-sm transition-all ${
            (pendingGroupRequestsCount || 0) > 0 
              ? 'border-purple-300 hover:border-purple-400' 
              : 'border-gray-200 hover:border-purple-300'
          }`}
        >
          <div className="relative">
            <FolderPlus className="h-10 w-10 text-purple-500 mb-4" />
            {(pendingGroupRequestsCount || 0) > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingGroupRequestsCount}
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Group Requests</h2>
          <p className="text-gray-600 text-sm">Review requests to create new groups</p>
        </Link>
      </div>
    </div>
  )
}
