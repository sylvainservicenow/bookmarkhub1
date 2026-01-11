'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UseAuthReturn {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
}

/**
 * Custom hook for reliable client-side authentication state.
 * Uses getUser() for initial check and onAuthStateChange for updates.
 * 
 * This hook ensures consistent auth state across all components by:
 * 1. Using getUser() instead of getSession() for server validation
 * 2. Listening to auth state changes for real-time updates
 * 3. Properly cleaning up subscriptions on unmount
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        // Use getUser() - it validates the session with Supabase server
        // Unlike getSession() which only reads from local storage
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (error) {
          // AuthSessionMissingError is expected when not logged in
          if (error.name !== 'AuthSessionMissingError') {
            console.error('Auth error:', error)
          }
        }
        
        if (mounted) {
          setUser(currentUser)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    initAuth()

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return {
    user,
    loading,
    isAuthenticated: !!user,
  }
}

/**
 * Hook to get auth state with a callback when user changes.
 * Useful for components that need to fetch data based on user.
 */
export function useAuthWithCallback(
  onUserChange?: (user: User | null) => void
): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  const handleUserChange = useCallback((newUser: User | null) => {
    setUser(newUser)
    if (onUserChange) {
      onUserChange(newUser)
    }
  }, [onUserChange])

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (error && error.name !== 'AuthSessionMissingError') {
          console.error('Auth error:', error)
        }
        
        if (mounted) {
          handleUserChange(currentUser)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          handleUserChange(session?.user ?? null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, handleUserChange])

  return {
    user,
    loading,
    isAuthenticated: !!user,
  }
}
