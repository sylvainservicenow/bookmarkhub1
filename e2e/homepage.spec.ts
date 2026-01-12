import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check page loads without being stuck
    await expect(page).toHaveTitle(/.+/)
    
    // Should have navigation
    await expect(page.locator('nav, header')).toBeVisible({ timeout: 10000 })
  })

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/')
    
    // Check for common navigation links
    const navLinks = ['browse', 'search', 'login', 'groups']
    
    for (const link of navLinks) {
      const navLink = page.locator(`a[href*="${link}"]`).first()
      if (await navLink.count() > 0) {
        await expect(navLink).toBeVisible()
      }
    }
  })
})
