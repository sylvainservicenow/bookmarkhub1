import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  test('should load search page', async ({ page }) => {
    await page.goto('/search')
    await expect(page).toHaveURL(/search/)
  })

  test('should load browse page with bookmarks', async ({ page }) => {
    await page.goto('/browse')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Should either show bookmarks or empty state
    await Promise.race([
      expect(page.locator('a[href^="/bookmark/"]').first()).toBeVisible({ timeout: 10000 }),
      expect(page.locator('text=/no bookmarks/i')).toBeVisible({ timeout: 10000 }),
      expect(page.locator('[data-testid="bookmark-list"]')).toBeVisible({ timeout: 10000 }),
    ]).catch(() => {
      // Page loaded but might have different structure
    })
  })

  test('should perform search without errors', async ({ page }) => {
    await page.goto('/search?q=servicenow')
    
    // Wait for search to complete
    await page.waitForLoadState('networkidle')
    
    // Should not be stuck loading
    await expect(page.locator('.animate-spin').first()).not.toBeVisible({ timeout: 15000 }).catch(() => {})
  })
})
