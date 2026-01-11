'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BookmarkIcon, Mail, Loader2, CheckCircle, LogIn } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
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

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        if (signInError.message.toLowerCase().includes('email not confirmed')) {
          setShowResendOption(true)
        }
        setLoading(false)
        return
      }

      // Check if user account is active
      if (data.user) {
        try {
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
        } catch (profileError) {
          // If profile check fails, still allow login (profile might not exist yet)
          console.error('Profile check failed:', profileError)
        }
      }

      // Show success state before redirect
      setSuccess(true)
      
      // Small delay to show success, then redirect
      setTimeout(() => {
        router.push(redirect)
        router.refresh()
      }, 500)
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }

    setResendLoading(true)
    setError(null)

    try {
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
    } catch (err) {
      setError('Failed to resend confirmation email')
    }

    setResendLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
          {error}
        </div>
      )}

      {resendSuccess && (
        <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
          <Mail className="h-4 w-4" />
          Confirmation email sent! Please check your inbox.
        </div>
      )}

      {showResendOption && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg animate-fade-in">
          <p className="text-amber-800 text-sm mb-2">
            Your email hasn't been confirmed yet.
          </p>
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={resendLoading}
            className="text-sm font-medium text-amber-700 hover:text-amber-800 underline disabled:opacity-50 inline-flex items-center gap-1"
          >
            {resendLoading && <Loader2 className="h-3 w-3 animate-spin" />}
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
          disabled={loading || success}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
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
          disabled={loading || success}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading || success}
        className={`w-full py-3 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
          success 
            ? 'bg-green-500 text-white' 
            : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
        } disabled:cursor-not-allowed`}
      >
        {success ? (
          <>
            <CheckCircle className="h-5 w-5" />
            Success! Redirecting...
          </>
        ) : loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn className="h-5 w-5" />
            Sign in
          </>
        )}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <BookmarkIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
