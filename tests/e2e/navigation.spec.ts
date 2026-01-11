import { test, expect } from '@playwright/test';

/**
 * Navigation Tests
 * Verifies all main routes and navigation elements work correctly
 */
test.describe('Navigation', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/BookmarkHub/i);
    
    // Check hero section exists
    await expect(page.locator('text=Discover')).toBeVisible();
  });

  test('main navigation links work', async ({ page }) => {
    await page.goto('/');
    
    // Test Browse link
    await page.click('text=Browse');
    await expect(page).toHaveURL(/\/browse/);
    
    // Test About link
    await page.goto('/');
    await page.click('text=About');
    await expect(page).toHaveURL(/\/about/);
  });

  test('category navigation pills work', async ({ page }) => {
    await page.goto('/');
    
    // Click on a category pill if it exists
    const categoryPill = page.locator('[data-testid="category-pill"]').first();
    if (await categoryPill.isVisible()) {
      await categoryPill.click();
      await expect(page).toHaveURL(/\/browse/);
    }
  });

  test('browse page loads and displays bookmarks', async ({ page }) => {
    await page.goto('/browse');
    
    // Should have search functionality
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    
    // Should display bookmark cards
    await expect(page.locator('[data-testid="bookmark-card"]').or(page.locator('.bookmark-card')).first()).toBeVisible({ timeout: 10000 });
  });

  test('search page accessible', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('input[type="text"], input[type="search"]')).toBeVisible();
  });

  test('footer links work', async ({ page }) => {
    await page.goto('/');
    
    // Test Privacy link
    const privacyLink = page.locator('footer a[href*="privacy"]');
    if (await privacyLink.isVisible()) {
      await privacyLink.click();
      await expect(page).toHaveURL(/\/privacy/);
    }
  });

  test('mobile navigation works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if mobile menu button exists
    const mobileMenuBtn = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]');
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click();
      // Menu should now be open
      await expect(page.locator('nav a')).toBeVisible();
    }
  });
});
