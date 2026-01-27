import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * COST-OPTIMIZED MIDDLEWARE
 * 
 * Key optimizations:
 * 1. Block known expensive bots FIRST (before any processing)
 * 2. Return cached responses for public pages
 * 3. Only check auth for protected routes
 */

// Bots that inflate Vercel costs without adding value
// These get blocked with a 403 before hitting any functions
const BLOCKED_BOTS = [
  'AhrefsBot',
  'SemrushBot', 
  'DotBot',
  'MJ12bot',
  'BLEXBot',
  'DataForSeoBot',
  'PetalBot',
  'Bytespider',
  'GPTBot',
  'CCBot',
  'anthropic-ai',
  'ClaudeBot',
  'Amazonbot',
  'FacebookBot',
  'meta-externalagent',
  'Applebot-Extended',
  'img2dataset',
  'Scrapy',
  'Python-urllib',
  'Python-requests',
  'curl/',
  'wget/',
  'Go-http-client',
  'Java/',
]

// Check if request is from a blocked bot
function isBlockedBot(userAgent: string | null): boolean {
  if (!userAgent) return false
  return BLOCKED_BOTS.some(bot => userAgent.includes(bot))
}

// Public paths that can be cached aggressively
const CACHEABLE_PATHS = ['/', '/browse', '/tags', '/about', '/privacy', '/help', '/pricing', '/contact']
const CACHEABLE_PREFIXES = ['/bookmark/']

function isCacheablePath(pathname: string): boolean {
  if (CACHEABLE_PATHS.includes(pathname)) return true
  return CACHEABLE_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export default withAuth(
  function middleware(req) {
    const userAgent = req.headers.get('user-agent') || ''
    const { pathname } = req.nextUrl
    
    // FIRST: Block expensive bots immediately
    // This is the most important cost optimization
    if (isBlockedBot(userAgent)) {
      return new NextResponse('Forbidden', { 
        status: 403,
        headers: {
          'Cache-Control': 'public, max-age=86400', // Cache the 403 for 24h
        }
      })
    }
    
    const response = NextResponse.next()
    
    // Add cache headers for public/anonymous requests
    const hasSession = req.cookies.has('next-auth.session-token') || 
                       req.cookies.has('__Secure-next-auth.session-token')
    
    if (!hasSession && isCacheablePath(pathname)) {
      // Aggressive caching for anonymous users
      if (pathname === '/') {
        response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')
      } else if (pathname === '/browse') {
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
      } else if (pathname.startsWith('/bookmark/')) {
        response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600')
      } else if (pathname === '/tags') {
        response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200')
      } else {
        response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200')
      }
    }
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
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
        
        if (isProtectedPath) {
          return !!token
        }
        
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
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}
