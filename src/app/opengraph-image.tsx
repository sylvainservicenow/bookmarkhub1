import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'BookmarkHub - ServiceNow Bookmarks & Resources'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #fbbf24 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo/Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            background: 'white',
            borderRadius: 24,
            marginBottom: 40,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          <svg
            width="70"
            height="70"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: 'white',
              margin: 0,
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            BookmarkHub
          </h1>
          <p
            style={{
              fontSize: 32,
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              marginTop: 16,
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            ServiceNow Bookmarks & Resources
          </p>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            marginTop: 48,
            padding: '16px 32px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 12,
          }}
        >
          <span style={{ fontSize: 24, color: 'white' }}>📚 Documentation</span>
          <span style={{ fontSize: 24, color: 'white' }}>🛠️ Tools</span>
          <span style={{ fontSize: 24, color: 'white' }}>💻 Scripts</span>
          <span style={{ fontSize: 24, color: 'white' }}>👥 Community</span>
        </div>

        {/* URL */}
        <p
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          www.mybookmarkhub.com
        </p>
      </div>
    ),
    {
      ...size,
    }
  )
}
