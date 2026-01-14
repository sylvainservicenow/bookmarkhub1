import { BookmarkIcon, Users, Star, Globe } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About BookmarkHub',
  description: 'BookmarkHub helps ServiceNow professionals discover, organize, and share the best resources - built by the community, for the community. Documentation, tools, scripts, and more.',
  keywords: ['ServiceNow community', 'ServiceNow resources', 'ServiceNow bookmarks', 'ServiceNow professionals'],
  openGraph: {
    title: 'About BookmarkHub | ServiceNow Community Resources',
    description: 'Built by ServiceNow professionals, for ServiceNow professionals. Discover and share the best resources.',
    url: 'https://www.mybookmarkhub.com/about',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About BookmarkHub</h1>
          <p className="text-xl text-gray-600">Connecting the ServiceNow community through shared knowledge</p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            BookmarkHub was created with a simple goal: to help ServiceNow professionals discover and share valuable web resources 
            within their communities. We believe that the best insights often come from trusted colleagues and peers 
            who have already done the research.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Whether you&apos;re looking for technical documentation, best practices, tutorials, or industry news, 
            BookmarkHub provides a collaborative platform where knowledge flows freely and quality content rises to the top.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <BookmarkIcon className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Curated Content</h3>
            <p className="text-gray-600">
              Every bookmark is contributed by community members, ensuring relevant and valuable ServiceNow resources.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Driven</h3>
            <p className="text-gray-600">
              Built by ServiceNow professionals, for ServiceNow professionals. Share resources privately or with the wider community.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality First</h3>
            <p className="text-gray-600">
              Ratings and comments help surface the most valuable content while providing context and insights.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Open Platform</h3>
            <p className="text-gray-600">
              Free to use with no barriers to entry. Everyone can contribute and benefit from shared knowledge.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">The Team</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            BookmarkHub is built and maintained by Sylvain Hauser, a ServiceNow professional passionate about 
            building tools that help the community work more efficiently.
          </p>
          <p className="text-gray-600 leading-relaxed">
            This project started as a personal tool to organize bookmarks and has grown into a platform 
            that serves the broader ServiceNow community.
          </p>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-semibold mb-2">Join Our Community</h2>
          <p className="mb-6 text-orange-50">
            Start discovering and sharing valuable ServiceNow resources today.
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/register" 
              className="bg-white text-orange-500 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              Get Started
            </a>
            <a 
              href="https://www.linkedin.com/in/sylvainhauser/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Connect on LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
