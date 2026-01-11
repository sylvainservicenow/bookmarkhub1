import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { NavigationProgress } from '@/components/layout/NavigationProgress'

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'BookmarkHub - Discover & Share the Best Bookmarks',
  description: 'Find curated bookmarks from teams worldwide. Browse by popularity, explore categories, and save your favorites.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} antialiased`}>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <Header />
        <main className="animate-fade-in">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
