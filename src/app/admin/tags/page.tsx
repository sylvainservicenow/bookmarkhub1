import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Tag, Plus, Settings, Clock } from 'lucide-react'
import { TagStatusSelect } from '@/components/admin/TagStatusSelect'
import { CreateTagForm } from '@/components/admin/CreateTagForm'
import { TagRequestsManager } from '@/components/admin/TagRequestsManager'

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

  // Get all tags with usage count and group associations
  const { data: tags } = await supabase
    .from('tags')
    .select(`
      *,
      bookmark_tags (count),
      tag_groups (group_id, groups(name))
    `)
    .order('name', { ascending: true })

  // Get pending tag requests count
  const { count: pendingCount } = await supabase
    .from('tag_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

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

      {/* Pending Tag Requests Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          Pending Tag Requests
          {(pendingCount ?? 0) > 0 && (
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

      {/* Tags Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tag Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Usage</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Visibility</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Groups</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tags?.map((tag: any) => {
              const groups = tag.tag_groups?.map((tg: any) => tg.groups?.name).filter(Boolean) || []
              return (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {tag.name}
                    </span>
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
                    {tag.visibility === 'restricted' ? (
                      groups.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {groups.map((name: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-red-500">No group assigned</span>
                      )
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <TagStatusSelect tagId={tag.id} currentStatus={tag.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tags/${tag.id}/edit`}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded inline-flex"
                      title="Edit tag"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
