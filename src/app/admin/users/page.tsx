'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import Link from 'next/link'
import { ArrowLeft, Users, User, Loader2 } from 'lucide-react'
import { UserRoleSelect } from '@/components/admin/UserRoleSelect'
import { UserStatusToggle } from '@/components/admin/UserStatusToggle'

interface UserData {
  id: string
  name: string | null
  email: string
  role: string
  status: string
  created_at: string
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'
  
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    
    if (!user?.id) {
      router.push('/login?redirect=/admin/users')
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

      // Get all users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      setUsers(usersData || [])
      setLoading(false)
    }

    fetchData()
  }, [user?.id, authLoading, router, supabase])

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading users...</span>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return null
  }

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
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
            <p className="text-gray-600">{users.length} users</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">User</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="font-medium text-gray-900">{u.name || 'No name'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">{u.email}</td>
                <td className="px-4 py-3">
                  <UserRoleSelect userId={u.id} currentRole={u.role} disabled={u.id === user.id} />
                </td>
                <td className="px-4 py-3">
                  <UserStatusToggle userId={u.id} currentStatus={u.status || 'active'} disabled={u.id === user.id} />
                </td>
                <td className="px-4 py-3 text-gray-500 text-sm">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
