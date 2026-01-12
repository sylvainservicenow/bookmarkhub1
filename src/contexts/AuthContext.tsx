'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  role: string
  status: string
  created_at: string | null
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())
  const mountedRef = useRef(true)
  const initializingRef = useRef(false)
  const lastRefreshRef = useRef<number>(0)

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!mountedRef.current) return null
    
    try {
      const { data, error: profileError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, role, status, created_at')
        .eq('id', userId)
        .single()
      
      if (profileError) {
        // PGRST116 means no row found - user profile may not exist yet
        if (profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError.message)
        }
        return null
      }
      return data
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Profile fetch exception:', err.message)
      }
      return null
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const profileData = await fetchProfile(user.id)
    if (mountedRef.current) {
      setProfile(profileData)
    }
  }, [user, fetchProfile])

  // New function to refresh session - can be called when auth seems stale
  const refreshSession = useCallback(async () => {
    // Debounce - don't refresh more than once per 5 seconds
    const now = Date.now()
    if (now - lastRefreshRef.current < 5000) {
      return
    }
    lastRefreshRef.current = now

    try {
      // Try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (!mountedRef.current) return

      if (refreshError) {
        console.warn('Session refresh failed:', refreshError.message)
        // Don't clear auth state on refresh failure - user might still be valid
        return
      }

      if (refreshedSession) {
        setSession(refreshedSession)
        setUser(refreshedSession.user)
        
        const profileData = await fetchProfile(refreshedSession.user.id)
        if (mountedRef.current) {
          setProfile(profileData)
        }
      }
    } catch (err) {
      console.error('Session refresh error:', err)
    }
  }, [supabase, fetchProfile])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      if (mountedRef.current) {
        setUser(null)
        setProfile(null)
        setSession(null)
      }
      // Force reload to clear any cached state
      window.location.href = '/'
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }, [supabase])

  useEffect(() => {
    mountedRef.current = true

    const initializeAuth = async () => {
      // Prevent double initialization
      if (initializingRef.current) return
      initializingRef.current = true

      try {
        // Get the current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (!mountedRef.current) return

        if (sessionError) {
          console.error('Session error:', sessionError.message)
          setError(sessionError.message)
          setLoading(false)
          return
        }

        if (currentSession) {
          // Validate the session by getting the user
          const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
          
          if (!mountedRef.current) return

          if (userError || !currentUser) {
            // Session exists but user validation failed - try refresh first
            console.warn('User validation failed, attempting refresh...')
            const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
            
            if (refreshedSession) {
              setSession(refreshedSession)
              setUser(refreshedSession.user)
              const profileData = await fetchProfile(refreshedSession.user.id)
              if (mountedRef.current) {
                setProfile(profileData)
              }
            } else {
              // Refresh also failed, clear auth
              await supabase.auth.signOut()
              setSession(null)
              setUser(null)
              setProfile(null)
            }
          } else {
            setSession(currentSession)
            setUser(currentUser)
            
            // Fetch profile
            const profileData = await fetchProfile(currentUser.id)
            if (mountedRef.current) {
              setProfile(profileData)
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Auth initialization error:', err.message)
          if (mountedRef.current) {
            setError(err.message)
          }
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false)
          initializingRef.current = false
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mountedRef.current) return

        console.log('Auth state changed:', event)

        if (event === 'SIGNED_OUT' || !newSession) {
          setSession(null)
          setUser(null)
          setProfile(null)
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession)
          setUser(newSession.user)
          
          const profileData = await fetchProfile(newSession.user.id)
          if (mountedRef.current) {
            setProfile(profileData)
          }
        }
      }
    )

    // Set up periodic session check (every 60 seconds)
    const intervalId = setInterval(async () => {
      if (!mountedRef.current || !session) return
      
      // Check if token is about to expire (within 5 minutes)
      const expiresAt = session.expires_at
      if (expiresAt) {
        const expiresInSeconds = expiresAt - Math.floor(Date.now() / 1000)
        if (expiresInSeconds < 300) {
          console.log('Token expiring soon, refreshing...')
          await refreshSession()
        }
      }
    }, 60000)

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
      clearInterval(intervalId)
    }
  }, [supabase, fetchProfile, refreshSession, session])

  // Also refresh on window focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (session && mountedRef.current) {
        refreshSession()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [session, refreshSession])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        error,
        signOut,
        refreshProfile,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
