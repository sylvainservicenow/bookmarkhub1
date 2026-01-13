import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Continue with the request
    return NextResponse.next()
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
