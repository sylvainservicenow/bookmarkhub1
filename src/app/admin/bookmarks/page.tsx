'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import Link from 'next/link'
import { ArrowLeft, Bookmark, ExternalLink, Pencil, Loader2, Search, Filter } from 'lucide-react'
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
    // Get initial filter from URL
    const urlStatus = searchParams.get('status')
    if (urlStatus) {
      setStatusFilter(urlStatus)
    }
  }, [searchParams])

  useEffect(() => {
    if (authLoading) return
    
    if (!user?.id) {
      router.push('/dashboard')
      return
    }

    const fetchData = async () => {
      setLoading(true)
      
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

      // Build query
      let query = supabase
        .from('bookmarks')
        .select(`
          id,
          title,
          url,
          visibility,
          status,
          failure_count,
          last_health_check,
          created_at,
          users:creator_id (name, email)
        `)
        .order('created_at', { ascending: false })
      
      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      
      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,url.ilike.%${searchQuery}%`)
      }
      
      const { data } = await query.limit(200)
      setBookmarks(data || [])
      setLoading(false)
    }

    fetchData()
  }, [user?.id, authLoading, statusFilter, searchQuery, supabase, router])

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    // Update URL without refresh
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('status')
    } else {
      params.set('status', value)
    }
    router.push(`/admin/bookmarks?${params.toString()}`, { scroll: false })
  }

  if (authLoading || (loading && !bookmarks.length)) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading bookmarks...</span>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
        
        <div className="flex items-center