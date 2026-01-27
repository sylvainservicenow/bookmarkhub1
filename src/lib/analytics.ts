/**
 * Google Analytics 4 Event Tracking
 * 
 * Usage:
 *   import { trackEvent } from '@/lib/analytics'
 *   trackEvent('sign_up', { method: 'email' })
 */

// Extend window type for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

/**
 * Track a custom event in Google Analytics 4
 * 
 * @param eventName - The name of the event (e.g., 'sign_up', 'bookmark_submit')
 * @param params - Optional parameters to send with the event
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
  }
}

// Pre-defined events for BookmarkHub
export const analytics = {
  // User registration completed
  signUp: (method: 'email' | 'google' | 'github' = 'email') => {
    trackEvent('sign_up', { method })
  },

  // User logged in
  login: (method: 'email' | 'google' | 'github' = 'email') => {
    trackEvent('login', { method })
  },

  // Bookmark submitted successfully
  bookmarkSubmit: (visibility: 'public' | 'private', tagCount: number) => {
    trackEvent('bookmark_submit', {
      visibility,
      tag_count: tagCount,
    })
  },

  // Bookmark clicked (outbound link)
  bookmarkClick: (bookmarkId: string, url: string) => {
    trackEvent('bookmark_click', {
      bookmark_id: bookmarkId,
      outbound_url: url,
    })
  },

  // Search performed
  search: (searchTerm: string, resultCount: number) => {
    trackEvent('search', {
      search_term: searchTerm,
      result_count: resultCount,
    })
  },

  // Tag filter applied
  filterByTag: (tagName: string) => {
    trackEvent('filter_by_tag', {
      tag_name: tagName,
    })
  },

  // Rating submitted
  ratingSubmit: (bookmarkId: string, rating: number) => {
    trackEvent('rating_submit', {
      bookmark_id: bookmarkId,
      rating_value: rating,
    })
  },

  // Favorite added
  favoriteAdd: (bookmarkId: string) => {
    trackEvent('favorite_add', {
      bookmark_id: bookmarkId,
    })
  },

  // Comment posted
  commentPost: (bookmarkId: string) => {
    trackEvent('comment_post', {
      bookmark_id: bookmarkId,
    })
  },
}
