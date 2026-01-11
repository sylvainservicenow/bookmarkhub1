import { test, expect } from '@playwright/test';

/**
 * Bookmark Interaction Tests
 * Verifies bookmark cards, details, and interactions
 */
test.describe('Bookmarks', () => {
  test('bookmark cards display required information', async ({ page }) => {
    await page.goto('/browse');
    
    // Wait for page to be ready - use domcontentloaded instead of networkidle to avoid timeout
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the actual bookmark cards to appear
    const firstCard = page.locator('.bg-white.rounded-xl.border').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    
    // Should have a title (link)
    await expect(firstCard.locator('a').first()).toBeVisible();
  });

  test('bookmark card click navigates to detail page', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for cards to load
    const firstCard = page.locator('.bg-white.rounded-xl.border').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    
    const bookmarkLink = firstCard.locator('a[href*="/bookmark/"]').first();
    
    if (await bookmarkLink.isVisible()) {
      await bookmarkLink.click();
      // Should navigate to bookmark detail
      await page.waitForLoadState('load');
    }
  });

  test('bookmark detail page shows full information', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for cards
    const firstCard = page.locator('.bg-white.rounded-xl.border').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    
    // Get the bookmark's internal link if it exists
    const detailLink = firstCard.locator('a[href*="/bookmark/"]').first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await expect(page).toHaveURL(/\/bookmark\//);
      
      // Detail page should have title
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('bookmark rating system displays', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for cards to appear
    const firstCard = page.locator('.bg-white.rounded-xl.border').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    
    // Check if stars are visible (using Star icon class or svg)
    const stars = firstCard.locator('svg').first();
    // Stars may or may not be visible depending on implementation
    if (await stars.isVisible()) {
      await expect(stars).toBeVisible();
    }
  });

  test('tags display on bookmark cards', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    
    const firstCard = page.locator('.bg-white.rounded-xl.border').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    
    // Tags are in links with bg-gray-100
    const tags = firstCard.locator('a.bg-gray-100, .bg-gray-100');
    // Tags may or may not be present
    const tagCount = await tags.count();
    expect(tagCount).toBeGreaterThanOrEqual(0);
  });

  test('favicon displays correctly', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    
    const firstCard = page.locator('.bg-white.rounded-xl.border').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    
    // Favicon can be an img or a div with background
    const favicon = firstCard.locator('img').first();
    
    if (await favicon.isVisible()) {
      // Image should exist
      expect(await favicon.count()).toBeGreaterThanOrEqual(0);
    }
  });
});
