import { SearchBox } from '@/components/search/SearchBox'
import { TopStats } from '@/components/home/TopStats'
import { SubmitBookmarkButton } from '@/components/home/SubmitBookmarkButton'

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-center">
          Bookmark Hub
        </h1>
        <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
          Discover, share, and organize bookmarks with your team
        </p>
        
        <SearchBox />
        
        {/* Submit Bookmark CTA */}
        <div className="mt-6">
          <SubmitBookmarkButton />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-12 px-4">
        <TopStats />
      </section>
    </div>
  )
}
