import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Create admin Supabase client for auth operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

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
          // Get user from auth.users
          const { data: authUsers, error: authError } = await supabaseAdmin
            .from('auth.users')
            .select('id, email, encrypted_password, email_confirmed_at')
            .eq('email', credentials.email.toLowerCase())
            .single()

          // If not found in view, try direct auth
          if (authError || !authUsers) {
            // Use Supabase auth to verify credentials
            const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
              email: credentials.email,
              password: credentials.password,
            })

            if (signInError || !signInData.user) {
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

            // Sign out from Supabase (we're using NextAuth sessions)
            await supabaseAdmin.auth.signOut()

            return {
              id: signInData.user.id,
              email: signInData.user.email!,
              name: profile?.name || signInData.user.email!.split('@')[0],
              image: profile?.avatar_url,
              role: profile?.role || 'user',
            }
          }

          // Manual password verification if we got the user directly
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            authUsers.encrypted_password
          )

          if (!isValidPassword) {
            throw new Error('Invalid email or password')
          }

          if (!authUsers.email_confirmed_at) {
            throw new Error('Please confirm your email before signing in')
          }

          // Get user profile
          const { data: profile } = await supabaseAdmin
            .from('users')
            .select('id, name, email, avatar_url, role, status')
            .eq('id', authUsers.id)
            .single()

          if (profile?.status === 'suspended') {
            throw new Error('Your account has been suspended')
          }

          if (profile?.status === 'archived') {
            throw new Error('Your account has been archived')
          }

          return {
            id: authUsers.id,
            email: authUsers.email!,
            name: profile?.name || authUsers.email!.split('@')[0],
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
