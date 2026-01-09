'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BookmarkIcon, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResendOption, setShowResendOption] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setShowResendOption(false)
    setResendSuccess(false)
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      // Show resend option if email not confirmed
      if (signInError.message.toLowerCase().includes('email not confirmed')) {
        setShowResendOption(true)
      }
      setLoading(false)
      return
    }

    // Check if user account is active
    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('status')
        .eq('id', data.user.id)
        .single()

      if (profile?.status === 'suspended') {
        await supabase.auth.signOut()
        setError('Your account has been suspended. Please contact an administrator.')
        setLoading(false)
        return
      }

      if (profile?.status === 'archived') {
        await supabase.auth.signOut()
        setError('Your account has been archived. Please contact an administrator to restore it.')
        setLoading(false)
        return
      }
    }

    router.push(redirect)
    router.refresh()
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }

    setResendLoading(true)
    setError(null)

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (resendError) {
      setError(resendError.message)
    } else {
      setResendSuccess(true)
      setShowResendOption(false)
    }

    setResendLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BookmarkIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Confirmation email sent! Please check your inbox.
            </div>
          )}

          {showResendOption && (
            <div className="bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg">
              <p className="text-amber-800 text-sm mb-2">
                Your email hasn't been confirmed yet.
              </p>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="text-sm font-medium text-amber-700 hover:text-amber-800 underline disabled:opacity-50"
              >
                {resendLoading ? 'Sending...' : 'Resend confirmation email'}
              </button>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary-600 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
