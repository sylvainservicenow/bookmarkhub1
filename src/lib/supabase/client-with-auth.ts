import { createBrowserClient } from '@supabase/ssr'
import { getSession } from 'next-auth/react'

// Create a Supabase client that uses NextAuth session
// This is for client-side data operations (not auth)
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Disable Supabase auth - we're using NextAuth
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  )

  return supabaseInstance
}

// Helper to get the current user ID from NextAuth session
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.user?.id ?? null
}
