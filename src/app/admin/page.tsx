import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Users, Bookmark, Tag, Shield, Clock, FolderPlus, CheckSquare } from 'lucide-react'

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
  const [
    { count: userCount },
    { count: bookmarkCount },
    { count: tagCount },
    { count: pendingBookmarksCount },
    { count: pendingGroupRequestsCount },
    { count: pendingSubmissionsCount },
    { count: pendingMembershipCount },
    { count: pendingCommentFlagsCount },
    { count: pendingArchiveCount },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('bookmarks').select('*', { count: 'exact', head: true }),
    supabase.from('tags').select('*', { count: 'exact', head: true }),
    supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('group_creation_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('group_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('comment_flags').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('archive_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const totalPendingApprovals = (pendingSubmissionsCount || 0) + (pendingGroupRequestsCount || 0) + 
    (pendingMembershipCount || 0) + (pendingCommentFlagsCount || 0) + (pendingArchiveCount || 0)

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
            <p className="text-gray-600">Manage users, bookmarks, tags, and approvals</p>
          </div>
        </div>
      </div>

      {/* Pending Approvals Alert */}
      {totalPendingApprovals > 0 && (
        <Link
          href="/admin/approvals"
          className="block mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-200 rounded-full">
                <Clock className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h2 className="font-semibold text-amber-900">Pending Approvals</h2>
                <p className="text-sm text-amber-700">
                  {totalPendingApprovals} item{totalPendingApprovals !== 1 ? 's' : ''} waiting for your review
                </p>
              </div>
            </div>
            <span className="text-amber-600 font-medium">Review now →</span>
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
          href="/admin/approvals"
          className={`bg-white border rounded-lg p-4 hover:shadow-sm transition-all ${
            totalPendingApprovals > 0 
              ? 'border-amber-300 bg-amber-50 hover:border-amber-400' 
              : 'border-gray-200 hover:border-amber-300'
          }`}
        >
          <CheckSquare className={`h-8 w-8 mb-2 ${totalPendingApprovals > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
          <div className="text-2xl font-bold text-gray-900">{totalPendingApprovals}</div>
          <div className="text-sm text-gray-500">Pending Approvals</div>
        </Link>
      </div>

      {/* Admin Sections */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Management</h2>
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Link
          href="/admin/approvals"
          className={`bg-white border rounded-lg p-6 hover:shadow-sm transition-all ${
            totalPendingApprovals > 0 
              ? 'border-amber-300 hover:border-amber-400' 
              : 'border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="relative">
            <CheckSquare className={`h-10 w-10 mb-4 ${totalPendingApprovals > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
            {totalPendingApprovals > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalPendingApprovals}
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Approvals</h2>
          <p className="text-gray-600 text-sm">Review submissions, memberships, and flags</p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <Users className="h-10 w-10 text-blue-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Users</h2>
          <p className="text-gray-600 text-sm">View, edit roles, and manage accounts</p>
        </Link>

        <Link
          href="/admin/bookmarks"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <Bookmark className="h-10 w-10 text-primary-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Bookmarks</h2>
          <p className="text-gray-600 text-sm">Review and moderate bookmarks</p>
        </Link>

        <Link
          href="/admin/tags"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:shadow-sm transition-all"
        >
          <Tag className="h-10 w-10 text-green-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Tags</h2>
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
          <p className="text-gray-600 text-sm">Review new group creation requests</p>
        </Link>
      </div>
    </div>
  )
}
