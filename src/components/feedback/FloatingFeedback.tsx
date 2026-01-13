'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, X, Send, CheckCircle, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

const TOPICS = [
  { value: 'bug', label: '🐛 Bug Report' },
  { value: 'feature', label: '✨ Feature Request' },
  { value: 'improvement', label: '💡 Improvement' },
  { value: 'content', label: '📚 Content Issue' },
  { value: 'other', label: '💬 Other' },
]

export function FloatingFeedback() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when closing
  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow animation
      const timeout = setTimeout(() => {
        if (!showSuccess) {
          setTopic('')
          setMessage('')
          setError(null)
        }
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [isOpen, showSuccess])

  // Don't render for non-authenticated users or while loading
  if (status === 'loading' || !session?.user) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!topic || !message.trim()) {
      setError('Please select a topic and enter your feedback')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Get full URL for page tracking
      const pageUrl = typeof window !== 'undefined' 
        ? window.location.href 
        : pathname

      // Submit to API (which handles database insert)
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          message: message.trim(),
          pageUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback')
      }

      // Show success animation
      setShowSuccess(true)
      setTopic('')
      setMessage('')

      // Close after animation
      setTimeout(() => {
        setShowSuccess(false)
        setIsOpen(false)
      }, 2000)
    } catch (err) {
      console.error('Feedback submission error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Feedback Form */}
      {isOpen && (
        <div 
          className={`absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 ${
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-white" />
              <h3 className="text-white font-semibold">Share Feedback</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close feedback form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Success State */}
          {showSuccess ? (
            <div className="p-8 flex flex-col items-center justify-center animate-fade-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce-once">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Thank you!</h4>
              <p className="text-gray-600 text-center">Your feedback has been submitted.</p>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label htmlFor="feedback-topic" className="block text-sm font-medium text-gray-700 mb-1">
                  Topic
                </label>
                <select
                  id="feedback-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  disabled={isSubmitting}
                >
                  <option value="">Select a topic...</option>
                  {TOPICS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Feedback
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !topic || !message.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Your feedback helps us improve BookmarkHub! 🙏
              </p>
            </form>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
            : 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-110'
        }`}
        aria-label={isOpen ? 'Close feedback form' : 'Open feedback form'}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <Lightbulb className="h-6 w-6" />
            {/* Tooltip */}
            <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Share Feedback
              <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-4 border-transparent border-l-gray-900" />
            </span>
          </>
        )}
      </button>
    </div>
  )
}
