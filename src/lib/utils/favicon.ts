/**
 * Get favicon URL for a given website URL using Google's favicon service
 * @param bookmarkUrl - The full URL of the bookmark
 * @returns The favicon URL or null if URL is invalid
 */
export function getFaviconUrl(bookmarkUrl: string): string | null {
  try {
    const domain = new URL(bookmarkUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
}

/**
 * Get domain from URL
 * @param url - The full URL
 * @returns The domain or null if URL is invalid
 */
export function getDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}
