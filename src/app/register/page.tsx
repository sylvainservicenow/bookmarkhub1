'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { BookmarkIcon, Mail, Loader2, CheckCircle, UserPlus, AlertTriangle } from 'lucide-react'

function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const redirect = searchParams.get('redirect') || '/dashboard'

  // Check if email is a ServiceNow corporate email
  const isServiceNowEmail = email.toLowerCase().endsWith('@servicenow.com')

  // If already logged in, redirect
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(redirect)
    }
  }, [status, router, redirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch (err) {
      console.error('Registration error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    )
  }

  // Don't show form if already logged in (will redirect)
  if (status === 'authenticated') {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-600">Redirecting...</span>
      </div>
    )
  }

  // Show success message
  if (success) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email!</h2>
        <p className="text-gray-600 mb-6">
          We've sent a confirmation link to <strong>{email}</strong>.
          Please click the link to activate your account.
        </p>
        {isServiceNowEmail && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">ServiceNow email detected</p>
                <p className="text-sm text-amber-700 mt-1">
                  Due to email filtering, the confirmation email may not arrive. 
                  The admin has been notified and will manually approve your account shortly.
                </p>
              </div>
            </div>
          </div>
        )}
        <Link 
          href="/login"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
          placeholder="John Doe"
        />
      </div>

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
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
          placeholder="you@example.com"
        />
        {isServiceNowEmail && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> ServiceNow corporate email may block our confirmation emails. 
                If you don't receive the email, the admin will be notified and can manually approve your account.
              </p>
            </div>
          </div>
        )}
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
          disabled={loading}
          minLength={8}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
          placeholder="••••••••"
        />
        <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            <UserPlus className="h-5 w-5" />
            Create account
          </>
        )}
      </button>
    </form>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <BookmarkIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
          <p className="text-gray-600 mt-2">Join BookmarkHub today</p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        }>
          <RegisterForm />
        </Suspense>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
