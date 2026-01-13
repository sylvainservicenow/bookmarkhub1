'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client-with-auth'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Lightbulb, 
  Loader2, 
  CheckCircle, 
  Archive, 
  Clock,
  User,
  Filter,
  RefreshCw,
  Eye,
  X,
  ExternalLink
} from 'lucide-react'

interface Feedback {
  id: string
  topic: string
  message: string
  status: string
  admin_notes: string | null
  page_url: string | null
  created_at: string
  updated_at: string
  reviewed_at: string | null
  user: {
    id: string
    name: string | null
    email: string | null
  } | null
  reviewed_by_user: {
    name: string | null
  } | null
}

const TOPICS: Record<string, { label: string; color: string }> = {
  bug: { label: '🐛 Bug', color: 'bg-red-100 text-red-800' },
  feature: { label: '✨ Feature', color: 'bg-purple-100 text-purple-800' },
  improvement: { label: '💡 Improvement', color: 'bg-blue-100 text-blue-800' },
  content: { label: '📚 Content', color: 'bg-amber-100 text-amber-800' },
  other: { label: '💬 Other', color: 'bg-gray-100 text-gray-800' },
}

const STATUSES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  submitted: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  reviewed: { label: 'Reviewed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-600', icon: Archive },
}

export default function AdminFeedbackPage() {
  const { data: session, status: authStatus } = useSession()
  const user = session?.user
  const authLoading = authStatus === 'loading'
  
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [topicFilter, setTopicFilter] = useState<string>('all')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  const fetchFeedbacks = async () => {
    setLoading(true)
    
    let query = supabase
      .from('feedback')
      .select(`
        id,
        topic,
        message,
        status,
        admin_notes,
        page_url,
        created_at,
        updated_at,
        reviewed_at,
        user:users!feedback_user_id_fkey(id, name, email),
        reviewed_by_user:users!feedback_reviewed_by_fkey(name)
      `)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }
    if (topicFilter !== 'all') {
      query = query.eq('topic', topicFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching feedbacks:', error)
    } else {
      setFeedbacks(data as Feedback[] || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    
    if (!user?.id) {
      router.push('/dashboard')
      return
    }

    const checkAdmin = async () => {
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

      fetchFeedbacks()
    }

    checkAdmin()
  }, [user?.id, authLoading, router, supabase])

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchFeedbacks()
    }
  }, [statusFilter, topicFilter])

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    setUpdating(true)
    
    const { error } = await supabase
      .from('feedback')
      .update({
        status: newStatus,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId)

    if (error) {
      console.error('Error updating feedback:', error)
    } else {
      setSelectedFeedback(null)
      setAdminNotes('')
      fetchFeedbacks()
    }
    setUpdating(false)
  }

  const openFeedbackModal = (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    setAdminNotes(feedback.admin_notes || '')
  }

  // Extract page path from URL for display
  const getPagePath = (url: string | null) => {
    if (!url) return null
    try {
      const urlObj = new URL(url)
      return urlObj.pathname
    } catch {
      return url
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading feedback...</span>
        </div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
              <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Feedback</h1>
              <p className="text-sm sm:text-base text-gray-600">{feedbacks.length} feedback items</p>
            </div>
          </div>
          <button
            onClick={fetchFeedbacks}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Topics</option>
          {Object.entries(TOPICS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h3>
          <p className="text-gray-600">Feedback from users will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((feedback) => {
            const topic = TOPICS[feedback.topic] || TOPICS.other
            const status = STATUSES[feedback.status] || STATUSES.submitted
            const StatusIcon = status.icon
            const preview = feedback.message.length > 80 
              ? feedback.message.substring(0, 80) + '...' 
              : feedback.message
            const pagePath = getPagePath(feedback.page_url)

            return (
              <div
                key={feedback.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer"
                onClick={() => openFeedbackModal(feedback)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${topic.color}`}>
                        {topic.label}
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(feedback.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{preview}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{feedback.user?.name || feedback.user?.email || 'Unknown user'}</span>
                      </div>
                      {pagePath && (
                        <div className="flex items-center gap-1 text-primary-600">
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{pagePath}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      openFeedbackModal(feedback)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${TOPICS[selectedFeedback.topic]?.color || 'bg-gray-100'}`}>
                  {TOPICS[selectedFeedback.topic]?.label || 'Other'}
                </span>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium ${STATUSES[selectedFeedback.status]?.color}`}>
                  {STATUSES[selectedFeedback.status]?.label}
                </span>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* User & Time Info */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium text-gray-700">
                    {selectedFeedback.user?.name || selectedFeedback.user?.email || 'Unknown'}
                  </span>
                </div>
                <span>
                  {new Date(selectedFeedback.created_at).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Page URL */}
              {selectedFeedback.page_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Submitted From</label>
                  <a
                    href={selectedFeedback.page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-primary-600 hover:bg-gray-100 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {getPagePath(selectedFeedback.page_url)}
                  </a>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <div className="p-4 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                  {selectedFeedback.message}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this feedback..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={updating}
                />
              </div>

              {/* Review Info */}
              {selectedFeedback.reviewed_at && (
                <div className="text-sm text-gray-500">
                  Reviewed by {selectedFeedback.reviewed_by_user?.name || 'Admin'} on{' '}
                  {new Date(selectedFeedback.reviewed_at).toLocaleDateString()}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleStatusChange(selectedFeedback.id, 'reviewed')}
                  disabled={updating || selectedFeedback.status === 'reviewed'}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  {updating ? 'Saving...' : 'Mark Reviewed'}
                </button>
                <button
                  onClick={() => handleStatusChange(selectedFeedback.id, 'archived')}
                  disabled={updating || selectedFeedback.status === 'archived'}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
                {selectedFeedback.status !== 'submitted' && (
                  <button
                    onClick={() => handleStatusChange(selectedFeedback.id, 'submitted')}
                    disabled={updating}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <Clock className="h-4 w-4" />
                    Reset to Submitted
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
