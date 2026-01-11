/**
 * Get favicon URL for a given bookmark URL
 * Uses Google's favicon service with DuckDuckGo as fallback
 */
export function getFaviconUrl(bookmarkUrl: string): string {
  try {
    const domain = new URL(bookmarkUrl).hostname
    // Google's favicon service - higher quality
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  } catch {
    return ''
  }
}

/**
 * Get fallback favicon URL using DuckDuckGo
 */
export function getFaviconUrlFallback(bookmarkUrl: string): string {
  try {
    const domain = new URL(bookmarkUrl).hostname
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`
  } catch {
    return ''
  }
}

/**
 * Extract domain from URL
 */
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return ''
  }
}
