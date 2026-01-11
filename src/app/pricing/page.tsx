import { Check } from 'lucide-react'

export const metadata = {
  title: 'Pricing - BookmarkHub',
  description: 'BookmarkHub pricing plans',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">Start sharing bookmarks with your team today</p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-orange-500">
            {/* Badge */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center py-2 font-semibold">
              Currently Free
            </div>
            
            {/* Card Content */}
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Free Plan</h2>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-gray-600 mt-2">Everything included, no limits</p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited bookmarks</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited tags</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Create and join groups</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Rate and comment on bookmarks</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Save favorites</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Advanced search & filtering</span>
                </li>
              </ul>

              {/* CTA */}
              <a 
                href="/register" 
                className="block w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all"
              >
                Get Started Free
              </a>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            BookmarkHub is currently free while in beta. Premium features may be introduced in the future.
          </p>
        </div>
      </div>
    </div>
  )
}
