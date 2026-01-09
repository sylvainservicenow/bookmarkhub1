'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'

export function SubmitBookmarkButton() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session?.user)
    }
    checkAuth()
  }, [supabase])

  const handleClick = () => {
    if (isLoggedIn) {
      router.push('/submit')
    } else {
      router.push('/login?redirect=/submit')
    }
  }

  // Don't render until we know auth state
  if (isLoggedIn === null) {
    return null
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
    >
      <Plus className="h-5 w-5" />
      Submit your bookmark
    </button>
  )
}
