import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'

// Lazy initialization of Supabase admin client
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          const supabaseAdmin = getSupabaseAdmin()
          
          // Use Supabase auth to verify credentials
          const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (signInError || !signInData.user) {
            if (signInError?.message?.includes('Email not confirmed')) {
              throw new Error('Please confirm your email before signing in')
            }
            throw new Error('Invalid email or password')
          }

          // Get user profile
          const { data: profile } = await supabaseAdmin
            .from('users')
            .select('id, name, email, avatar_url, role, status')
            .eq('id', signInData.user.id)
            .single()

          if (profile?.status === 'suspended') {
            throw new Error('Your account has been suspended')
          }

          if (profile?.status === 'archived') {
            throw new Error('Your account has been archived')
          }

          return {
            id: signInData.user.id,
            email: signInData.user.email!,
            name: profile?.name || signInData.user.email!.split('@')[0],
            image: profile?.avatar_url,
            role: profile?.role || 'user',
          }
        } catch (error) {
          if (error instanceof Error) {
            throw error
          }
          throw new Error('Authentication failed')
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
      }

      // Handle session update (e.g., role change)
      if (trigger === 'update' && session) {
        token.name = session.name
        token.role = session.role
      }

      // Refresh user data from database periodically
      if (token.id && Date.now() - (token.lastRefresh as number || 0) > 5 * 60 * 1000) {
        try {
          const supabaseAdmin = getSupabaseAdmin()
          const { data: profile } = await supabaseAdmin
            .from('users')
            .select('name, avatar_url, role, status')
            .eq('id', token.id)
            .single()

          if (profile) {
            if (profile.status === 'suspended' || profile.status === 'archived') {
              // Return empty token to force sign out
              return {}
            }
            token.name = profile.name
            token.picture = profile.avatar_url
            token.role = profile.role
          }
          token.lastRefresh = Date.now()
        } catch (error) {
          console.error('Failed to refresh user data:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
