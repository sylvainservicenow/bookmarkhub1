import Link from 'next/link'
import { Clock, Tag, TrendingUp, Star } from 'lucide-react'

interface ActivitySidebarProps {
  recentActivity: {
    id: string
    title: string
    created_at: string
    users?: { id: string; name: string | null } | null
  }[]
  popularTags: string[]
}

export function ActivitySidebar({ recentActivity, popularTags }: ActivitySidebarProps) {
  return (
    <div className="space-y-6">
      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-primary-500" />
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        </div>
        
        <div className="space-y-4">
          {recentActivity.map((item, index) => {
            const userName = item.users?.name || 'Anonymous'
            const initial = userName.charAt(0).toUpperCase()
            const timeAgo = getTimeAgo(item.created_at)
            
            // Alternate between different activity types for visual variety
            const activityTypes = ['added', 'rated', 'trending']
            const activityType = activityTypes[index % 3]
            
            return (
              <div key={item.id} className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700 shrink-0">
                  {activityType === 'trending' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : activityType === 'rated' ? (
                    <Star className="h-4 w-4" />
                  ) : (
                    initial
                  )}
                </div>
                
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600">
                    {activityType === 'trending' ? (
                      <>
                        <span className="font-medium text-gray-900">System</span>
                        {' is trending '}
                      </>
                    ) : activityType === 'rated' ? (
                      <>
                        <span className="font-medium text-gray-900">{userName}</span>
                        {' rated '}
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-gray-900">{userName}</span>
                        {' added '}
                      </>
                    )}
                    <Link
                      href={`/bookmark/${item.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {item.title.length > 25 ? item.title.substring(0, 25) + '...' : item.title}
                    </Link>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-4 w-4 text-primary-500" />
            <h3 className="font-semibold text-gray-900">Popular Tags</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Link
                key={tag}
                href={`/browse?tag=${encodeURIComponent(tag)}`}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}
