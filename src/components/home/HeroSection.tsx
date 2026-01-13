import { HeroSearchBox } from './HeroSearchBox'
import { HeroStats } from './HeroStats'
import { Sparkles } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="bg-hero-gradient bg-hero-pattern">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
            <Sparkles className="h-4 w-4 text-primary-500" />
            <span className="text-sm font-medium text-gray-700">Best ServiceNow resources at your fingertips</span>
          </div>
        </div>
        
        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 text-center mb-4">
          Discover & Share the Best Bookmarks
        </h1>
        
        {/* Subheading */}
        <p className="text-lg md:text-xl text-gray-600 text-center mb-10 max-w-2xl mx-auto">
          Find curated ServiceNow bookmarks. Browse by popularity,
          explore categories, save your favorites and share your findings.
        </p>
        
        {/* Search Box */}
        <HeroSearchBox />
        
        {/* Stats */}
        <HeroStats />
      </div>
    </section>
  )
}
