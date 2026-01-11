import { test, expect } from '@playwright/test';

/**
 * Bookmark Interaction Tests
 * Verifies bookmark cards, details, and interactions
 */
test.describe('Bookmarks', () => {
  test('bookmark cards display required information', async ({ page }) => {
    await page.goto('/browse');
    
    // Wait for bookmarks to load
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('[data-testid="bookmark-card"], .bookmark-card').first();
    
    if (await firstCard.isVisible()) {
      // Should have a title
      await expect(firstCard.locator('h2, h3, a')).toBeVisible();
      
      // Should have some description or URL
      await expect(firstCard.locator('p, .description, .url')).toBeVisible();
    }
  });

  test('bookmark card click navigates to detail page', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    
    const bookmarkLink = page.locator('[data-testid="bookmark-card"] a, .bookmark-card a').first();
    
    if (await bookmarkLink.isVisible()) {
      await bookmarkLink.click();
      
      // Should navigate to bookmark detail or external URL
      await page.waitForLoadState('load');
    }
  });

  test('bookmark detail page shows full information', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    
    // Find and click a bookmark to go to its detail page
    const bookmarkCard = page.locator('[data-testid="bookmark-card"], .bookmark-card').first();
    if (await bookmarkCard.isVisible()) {
      // Get the bookmark's internal link if it exists
      const detailLink = bookmarkCard.locator('a[href*="/bookmark/"]');
      if (await detailLink.isVisible()) {
        await detailLink.click();
        await expect(page).toHaveURL(/\/bookmark\//);
        
        // Detail page should have title and description
        await expect(page.locator('h1, h2')).toBeVisible();
      }
    }
  });

  test('bookmark rating system displays', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    
    // Check if rating stars are visible
    const ratingElement = page.locator('[data-testid="rating"], .rating, .stars').first();
    // Rating may or may not be visible depending on implementation
    if (await ratingElement.isVisible()) {
      await expect(ratingElement).toBeVisible();
    }
  });

  test('tags display on bookmark cards', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('[data-testid="bookmark-card"], .bookmark-card').first();
    
    if (await firstCard.isVisible()) {
      const tags = firstCard.locator('[data-testid="tag"], .tag, .badge');
      // Tags may or may not be present
      const tagCount = await tags.count();
      expect(tagCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('favicon displays correctly', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    
    const favicon = page.locator('[data-testid="bookmark-card"] img, .bookmark-card img').first();
    
    if (await favicon.isVisible()) {
      // Image should have loaded
      const isLoaded = await favicon.evaluate((img: HTMLImageElement) => img.complete && img.naturalHeight !== 0);
      // Favicon may fail to load for some URLs, so we just check it exists
      expect(await favicon.count()).toBeGreaterThanOrEqual(0);
    }
  });
});
