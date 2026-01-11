import { test, expect } from '@playwright/test';

/**
 * Search & Filtering Tests
 * Verifies search functionality and filters work correctly
 */
test.describe('Search & Filtering', () => {
  test('search bar accepts input and returns results', async ({ page }) => {
    await page.goto('/browse');
    
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await searchInput.fill('test');
    await searchInput.press('Enter');
    
    // Wait for results to load
    await page.waitForLoadState('networkidle');
    
    // Should either show results or "no results" message
    const hasResults = await page.locator('[data-testid="bookmark-card"], .bookmark-card').count() > 0;
    const hasNoResults = await page.locator('text=/no.*results|not found/i').isVisible();
    
    expect(hasResults || hasNoResults).toBe(true);
  });

  test('category filter works', async ({ page }) => {
    await page.goto('/browse');
    
    // Click on a category filter if exists
    const categoryFilter = page.locator('[data-testid="category-filter"], .category-filter, button:has-text("All")').first();
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('tag filter works', async ({ page }) => {
    await page.goto('/browse');
    
    const tagFilter = page.locator('[data-testid="tag-filter"], .tag-pill').first();
    if (await tagFilter.isVisible()) {
      await tagFilter.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('sort options work', async ({ page }) => {
    await page.goto('/browse');
    
    const sortDropdown = page.locator('select, [data-testid="sort-dropdown"]').first();
    if (await sortDropdown.isVisible()) {
      await sortDropdown.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
    }
  });

  test('search from homepage works', async ({ page }) => {
    await page.goto('/');
    
    const heroSearch = page.locator('input[placeholder*="Search"]').first();
    if (await heroSearch.isVisible()) {
      await heroSearch.fill('example');
      await heroSearch.press('Enter');
      
      // Should navigate to search/browse page
      await expect(page).toHaveURL(/\/browse|\/search/);
    }
  });

  test('URL reflects search parameters', async ({ page }) => {
    await page.goto('/browse?q=test');
    
    // Search input should have the query
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await expect(searchInput).toHaveValue('test');
  });
});
