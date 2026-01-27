import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Enhanced middleware that combines:
 * 1. NextAuth authentication protection
 * 2. Bot blocking (saves edge requests)
 * 3. Cache headers for public pages (saves function invocations)
 */

// Bots that inflate your Vercel costs without adding value
const BLOCKED_USER_AGENTS = [
  'AhrefsBot',
  'SemrushBot', 
  'DotBot',
  'MJ12bot',
  'BLEXBot',
  'DataForSeoBot',
  'PetalBot',
  'Bytespider',
]

export default withAuth(
  function middleware(req) {
    const userAgent = req.headers.get('user-agent') || ''
    const { pathname } = req.nextUrl
    
    // Block known SEO bots that don't help your ServiceNow community
    // This alone can reduce edge requests by 10-20%
    for (const bot of BLOCKED_USER_AGENTS) {
      if (userAgent.includes(bot)) {
        // Return a simple 403 - costs almost nothing
        return new NextResponse('Forbidden', { status: 403 })
      }
    }
    
    const response = NextResponse.next()
    
    // Add cache headers for public pages (non-authenticated users)
    // This reduces Vercel Function invocations dramatically
    const hasSession = req.cookies.has('next-auth.session-token') || 
                       req.cookies.has('__Secure-next-auth.session-token')
    
    if (!hasSession) {
      // Public homepage - cache for 5 minutes
      if (pathname === '/') {
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
      }
      // Browse page - cache for 2 minutes (changes more often)
      else if (pathname === '/browse') {
        response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
      }
      // Individual bookmark pages - cache for 10 minutes
      else if (pathname.startsWith('/bookmark/')) {
        response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')
      }
      // Static content pages
      else if (['/about', '/privacy', '/help', '/pricing', '/contact'].includes(pathname)) {
        response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200')
      }
      // Tags page
      else if (pathname.startsWith('/tags')) {
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
      }
    }
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protected routes that require authentication
        const protectedPaths = [
          '/dashboard',
          '/submit',
          '/bookmarks',
          '/favorites',
          '/settings',
          '/admin',
        ]
        
        const path = req.nextUrl.pathname
        const isProtectedPath = protectedPaths.some(p => path.startsWith(p))
        
        // If it's a protected path, require a token
        if (isProtectedPath) {
          return !!token
        }
        
        // Allow all other paths
        return true
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
