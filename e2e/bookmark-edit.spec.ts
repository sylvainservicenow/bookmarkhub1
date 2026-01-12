import { test, expect } from '@playwright/test'

test.describe('Bookmark Edit Page', () => {
  test('should redirect to login when accessing edit page unauthenticated', async ({ page }) => {
    // Try to access an edit page directly
    await page.goto('/bookmarks/00000000-0000-0000-0000-000000000000/edit')
    
    // Should redirect to login or show sign-in required message
    await Promise.race([
      expect(page).toHaveURL(/login/, { timeout: 10000 }),
      expect(page.locator('text=/sign in/i')).toBeVisible({ timeout: 10000 }),
    ])
  })

  test('should not get stuck on loading state', async ({ page }) => {
    // Navigate to a bookmark and try to edit
    await page.goto('/browse')
    
    const bookmarkLink = page.locator('a[href^="/bookmark/"]').first()
    
    if (await bookmarkLink.count() > 0) {
      // Get the bookmark ID from the href
      const href = await bookmarkLink.getAttribute('href')
      const bookmarkId = href?.split('/').pop()
      
      if (bookmarkId) {
        // Go directly to edit page
        await page.goto(`/bookmarks/${bookmarkId}/edit`)
        
        // Should not be stuck loading for more than 15 seconds
        // Either redirects to login, shows permission denied, or loads the form
        await Promise.race([
          expect(page).toHaveURL(/login/, { timeout: 15000 }),
          expect(page.locator('text=/permission denied/i')).toBeVisible({ timeout: 15000 }),
          expect(page.locator('text=/sign in/i')).toBeVisible({ timeout: 15000 }),
          expect(page.locator('form')).toBeVisible({ timeout: 15000 }),
          expect(page.locator('text=/not found/i')).toBeVisible({ timeout: 15000 }),
        ])
        
        // Verify NOT stuck on loading
        const loadingSpinner = page.locator('text=Loading...')
        await expect(loadingSpinner).not.toBeVisible({ timeout: 5000 }).catch(() => {
          // If still showing loading after 15s total, fail the test
          throw new Error('Page stuck on loading state')
        })
      }
    }
  })
})
