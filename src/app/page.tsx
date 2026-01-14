import { HeroSection } from '@/components/home/HeroSection'
import { TrendingSection } from '@/components/home/TrendingSection'
import { TopRatedSection } from '@/components/home/TopRatedSection'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with warm gradient */}
      <HeroSection />
      
      {/* Trending Today */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <TrendingSection />
      </section>
      
      {/* Top Rated */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <TopRatedSection />
      </section>
    </div>
  )
}
