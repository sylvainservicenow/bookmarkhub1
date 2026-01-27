import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * GET /api/debug/traffic
 * 
 * Simple endpoint to check recent traffic patterns.
 * Access at: https://www.mybookmarkhub.com/api/debug/traffic
 * 
 * This helps diagnose what's causing high Vercel costs.
 */

// In-memory store for recent requests (resets on cold start)
// This is just for debugging - not persistent
const recentRequests: Array<{
  timestamp: string
  path: string
  userAgent: string
  ip: string
}> = []

const MAX_STORED = 100

export function logRequest(req: NextRequest) {
  const entry = {
    timestamp: new Date().toISOString(),
    path: req.nextUrl.pathname,
    userAgent: req.headers.get('user-agent') || 'unknown',
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
  }
  
  recentRequests.unshift(entry)
  if (recentRequests.length > MAX_STORED) {
    recentRequests.pop()
  }
}

export async function GET(request: NextRequest) {
  // Basic auth check - only allow admin access
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Basic ${Buffer.from('admin:bookmarkhub2024').toString('base64')}`
  
  if (authHeader !== expectedAuth) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Traffic Debug"',
      },
    })
  }

  // Analyze user agents
  const userAgentCounts: Record<string, number> = {}
  const pathCounts: Record<string, number> = {}
  
  recentRequests.forEach(req => {
    // Count user agents
    const ua = req.userAgent.substring(0, 50) // Truncate for readability
    userAgentCounts[ua] = (userAgentCounts[ua] || 0) + 1
    
    // Count paths
    pathCounts[req.path] = (pathCounts[req.path] || 0) + 1
  })

  const sortedUAs = Object.entries(userAgentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  const sortedPaths = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  return NextResponse.json({
    totalTracked: recentRequests.length,
    note: 'This resets on cold start. Check over time for patterns.',
    topUserAgents: sortedUAs,
    topPaths: sortedPaths,
    recentRequests: recentRequests.slice(0, 20),
  })
}
