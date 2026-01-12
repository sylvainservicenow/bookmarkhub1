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
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
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

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!mountedRef.current) return null
    
    try {
      const { data, error: profileError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, role, status')
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
            // Session exists but user validation failed - clear it
            console.warn('Session invalid, clearing...')
            await supabase.auth.signOut()
            setSession(null)
            setUser(null)
            setProfile(null)
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

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

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
