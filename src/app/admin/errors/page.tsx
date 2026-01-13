'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client-with-auth'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Clock, Bug, Zap, Check, RefreshCw, Loader2, Filter, X } from 'lucide-react'

interface ClientError {
  id: string
  error_type: 'loading_timeout' | 'api_error' | 'react_error' | 'unhandled_error'
  message: string
  page_url: string
  component: string | null
  user_id: string | null
  user_agent: string | null
  metadata: Record<string, any>
  resolved: boolean
  resolved_at: string | null
  created_at: string
  users?: { name: string; email: string } | null
}

const ERROR_TYPE_CONFIG = {
  loading_timeout: { icon: Clock, label: 'Loading Timeout', color: 'amber' },
  api_error: { icon: Zap, label: 'API Error', color: 'red' },
  react_error: { icon: Bug, label: 'React Error', color: 'purple' },
  unhandled_error: { icon: AlertTriangle, label: 'Unhandled Error', color: 'orange' },
}

export default function AdminErrorsPage() {
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'
  
  const router = useRouter()
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [errors, setErrors] = useState<ClientError[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unresolved' | ClientError['error_type']>('unresolved')
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const supabase = createClient()

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
      }
    }
    
    checkAdmin()
  }, [authLoading, user?.id, router])

  const fetchErrors = async () => {
    setLoading(true)
    
    let query = supabase
      .from('client_errors')
      .select('*, users:user_id(name, email)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (filter === 'unresolved') {
      query = query.eq('resolved', false)
    } else if (filter !== 'all') {
      query = query.eq('error_type', filter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching errors:', error)
    } else {
      setErrors(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchErrors()
    }
  }, [profile, filter])

  const handleResolve = async (errorId: string) => {
    setResolvingId(errorId)
    
    const { error } = await supabase
      .from('client_errors')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
      })
      .eq('id', errorId)

    if (!error) {
      setErrors(errors.map(e => 
        e.id === errorId ? { ...e, resolved: true, resolved_at: new Date().toISOString() } : e
      ))
    }
    setResolvingId(null)
  }

  const unresolvedCount = errors.filter(e => !e.resolved).length

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4" />Back to Admin
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Error Monitoring</h1>
          <p className="text-gray-600">
            {unresolvedCount} unresolved error{unresolvedCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={fetchErrors}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="h-4 w-4 text-gray-500" />
        {(['unresolved', 'all', 'loading_timeout', 'api_error', 'react_error', 'unhandled_error'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'unresolved' ? 'Unresolved' : f === 'all' ? 'All' : ERROR_TYPE_CONFIG[f].label}
          </button>
        ))}
      </div>

      {/* Error list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : errors.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">No errors found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {errors.map((error) => {
            const config = ERROR_TYPE_CONFIG[error.error_type]
            const Icon = config.icon
            
            return (
              <div
                key={error.id}
                className={`bg-white border rounded-lg p-4 ${
                  error.resolved ? 'border-gray-200 opacity-60' : 'border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg bg-${config.color}-100`}>
                      <Icon className={`h-5 w-5 text-${config.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full bg-${config.color}-100 text-${config.color}-700`}>
                          {config.label}
                        </span>
                        {error.component && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                            {error.component}
                          </span>
                        )}
                        {error.resolved && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 mb-1">{error.message}</p>
                      <p className="text-sm text-gray-500 truncate">{error.page_url}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{new Date(error.created_at).toLocaleString()}</span>
                        {error.users && (
                          <span>User: {error.users.name || error.users.email}</span>
                        )}
                      </div>
                      {error.metadata && Object.keys(error.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                            View details
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(error.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  {!error.resolved && (
                    <button
                      onClick={() => handleResolve(error.id)}
                      disabled={resolvingId === error.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      {resolvingId === error.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
