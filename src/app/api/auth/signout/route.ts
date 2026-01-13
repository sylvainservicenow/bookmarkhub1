import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = cookies()
  
  // Clear all NextAuth cookies
  const cookieNames = [
    'next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.csrf-token',
    '__Secure-next-auth.callback-url',
    '__Host-next-auth.csrf-token',
  ]
  
  const response = NextResponse.json({ success: true })
  
  // Delete each cookie
  for (const name of cookieNames) {
    response.cookies.delete(name)
    // Also try to delete with various path options
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/',
    })
  }
  
  return response
}

export async function GET() {
  return POST()
}
