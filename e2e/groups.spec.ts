import { test, expect } from '@playwright/test'

test.describe('Groups Functionality', () => {
  test('should load groups page', async ({ page }) => {
    await page.goto('/groups')
    
    await page.waitForLoadState('networkidle')
    
    // Should show groups or prompt to login
    await Promise.race([
      expect(page.locator('text=/groups/i').first()).toBeVisible({ timeout: 10000 }),
      expect(page.locator('text=/sign in/i')).toBeVisible({ timeout: 10000 }),
    ])
  })
})
