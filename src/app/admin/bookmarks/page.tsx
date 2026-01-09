import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Bookmark, ExternalLink } from 'lucide-react'
import { BookmarkStatusSelect } from '@/components/admin/BookmarkStatusSelect'

export default async function AdminBookmarksPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?redirect=/admin/bookmarks')
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

  // Get all bookmarks with creator info
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(`
      *,
      users:creator_id (name, email)
    `)
    .order('created_at', { ascending: false })

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
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Bookmark className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Bookmarks</h1>
            <p className="text-gray-600">{bookmarks?.length || 0} bookmarks</p>
          </div>
        </div>
      </div>

      {/* Bookmarks Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Creator</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Visibility</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Created</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookmarks?.map((b: any) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/bookmark/${b.id}`} className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1">
                    {b.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">
                  {b.users?.name || b.users?.email?.split('@')[0] || 'Unknown'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    b.visibility === 'public' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {b.visibility}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <BookmarkStatusSelect bookmarkId={b.id} currentStatus={b.status} />
                </td>
                <td className="px-4 py-3 text-gray-500 text-sm">
                  {new Date(b.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-primary-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
