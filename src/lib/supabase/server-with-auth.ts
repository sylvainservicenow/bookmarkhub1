import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

// Admin client for server-side operations
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Get current user ID from NextAuth session (server-side)
export async function getServerUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id ?? null
}

// Get full session (server-side)
export async function getServerSession2() {
  return getServerSession(authOptions)
}
