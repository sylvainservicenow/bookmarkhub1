import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * GET /api/debug/traffic
 * 
 * Simple endpoint to check if the API is working.
 * The detailed traffic analysis was causing build issues,
 * so this is now just a simple health check.
 */

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

  return NextResponse.json({
    status: 'ok',
    message: 'Traffic debug endpoint. Check Vercel logs for detailed traffic analysis.',
    timestamp: new Date().toISOString(),
  })
}
