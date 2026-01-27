/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable static optimization where possible
  experimental: {
    // Reduce function cold starts
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
  
  // Aggressive caching headers to reduce edge requests
  async headers() {
    return [
      {
        // Cache static assets for 1 year
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache JS/CSS chunks for 1 year (they have hashes)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache homepage for 5 minutes at edge, serve stale while revalidating
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        // Cache browse page for 2 minutes (changes more often)
        source: '/browse',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=120, stale-while-revalidate=300',
          },
        ],
      },
      {
        // Cache individual bookmark pages for 10 minutes
        source: '/bookmark/:id*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=600, stale-while-revalidate=1200',
          },
        ],
      },
      {
        // Cache API responses for search suggestions
        source: '/api/search/suggestions',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
      {
        // Static pages - cache for 1 hour
        source: '/(about|privacy|help|pricing)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        ],
      },
    ]
  },
  
  // Reduce image optimization costs
  images: {
    // Disable default image optimization (uses Vercel compute)
    // Since you're using favicon_url, most images are external anyway
    unoptimized: true,
  },
}

module.exports = nextConfig
