'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

export interface CurrentUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string
}

export function useCurrentUser() {
  const { data: session, status, update } = useSession()

  const user = useMemo<CurrentUser | null>(() => {
    if (!session?.user) return null
    return {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
      role: session.user.role,
    }
  }, [session])

  return {
    user,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
    unauthenticated: status === 'unauthenticated',
    update, // For refreshing session data
  }
}
