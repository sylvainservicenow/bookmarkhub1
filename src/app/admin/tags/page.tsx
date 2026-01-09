import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Tag, Plus } from 'lucide-react'
import { TagStatusSelect } from '@/components/admin/TagStatusSelect'
import { CreateTagForm } from '@/components/admin/CreateTagForm'

export default async function AdminTagsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?redirect=/admin/tags')
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

  // Get all tags with usage count
  const { data: tags } = await supabase
    .from('tags')
    .select(`
      *,
      bookmark_tags (count)
    `)
    .order('name', { ascending: true })

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
              <p className="text-gray-600">{tags?.length || 0} tags</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Tag Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Tag
        </h2>
        <CreateTagForm />
      </div>

      {/* Tags Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tag Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Usage</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Visibility</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tags?.map((tag: any) => (
              <tr key={tag.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/search?tag=${encodeURIComponent(tag.name)}`}
                    className="font-medium text-gray-900 hover:text-primary-600"
                  >
                    {tag.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">
                  {tag.bookmark_tags?.[0]?.count || 0} bookmarks
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    tag.visibility === 'public' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {tag.visibility}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <TagStatusSelect tagId={tag.id} currentStatus={tag.status} />
                </td>
                <td className="px-4 py-3 text-gray-500 text-sm">
                  {new Date(tag.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
