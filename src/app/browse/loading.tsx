import { Loader2 } from 'lucide-react'

export default function BrowseLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="h-7 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-1"></div>
            </div>
            <div className="flex-1 max-w-xl">
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </header>
      
      {/* Main Content Loading */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar Skeleton */}
          <aside className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </aside>
          
          {/* Main Content - Loading Animation */}
          <main className="lg:col-span-6">
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 text-primary-500 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Loading bookmarks...</p>
              <p className="text-gray-400 text-sm mt-1">This won't take long</p>
            </div>
            
            {/* Skeleton Cards */}
            <div className="space-y-3 mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-gray-100 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
          
          {/* Right Sidebar Skeleton */}
          <aside className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-6 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
