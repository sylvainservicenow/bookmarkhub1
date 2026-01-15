import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { NavigationProgress } from '@/components/layout/NavigationProgress'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { FloatingFeedback } from '@/components/feedback/FloatingFeedback'
import { JsonLd } from '@/components/seo/JsonLd'

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: {
    default: 'BookmarkHub - ServiceNow Bookmarks & Resources',
    template: '%s | BookmarkHub'
  },
  description: 'Discover and share the best ServiceNow bookmarks. Curated resources for developers, admins, and architects - documentation, tools, GitHub repos, and community content.',
  keywords: ['ServiceNow', 'ServiceNow bookmarks', 'ServiceNow resources', 'ServiceNow documentation', 'ServiceNow developer', 'ServiceNow community', 'ServiceNow tools', 'ServiceNow scripts'],
  authors: [{ name: 'Sylvain Hauser' }],
  creator: 'Sylvain Hauser',
  publisher: 'BookmarkHub',
  metadataBase: new URL('https://www.mybookmarkhub.com'),
  alternates: {
    canonical: 'https://www.mybookmarkhub.com',
  },
  openGraph: {
    title: 'BookmarkHub - ServiceNow Bookmarks & Resources',
    description: 'Discover and share the best ServiceNow bookmarks. Curated resources for the ServiceNow community.',
    url: 'https://www.mybookmarkhub.com',
    siteName: 'BookmarkHub',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BookmarkHub - ServiceNow Bookmarks & Resources',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BookmarkHub - ServiceNow Bookmarks & Resources',
    description: 'Discover and share the best ServiceNow bookmarks and resources.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', sizes: '32x32', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <JsonLd />
      </head>
      <body className={`${dmSans.className} antialiased`}>
        <SessionProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <Header />
          <main className="animate-fade-in">{children}</main>
          <Footer />
          <FloatingFeedback />
        </SessionProvider>
      </body>
    </html>
  )
}
