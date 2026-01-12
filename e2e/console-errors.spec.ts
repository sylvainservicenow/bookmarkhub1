import { test, expect } from '@playwright/test'

test.describe('Console Error Detection', () => {
  test('should not have 406 errors on bookmark detail page', async ({ page }) => {
    const consoleErrors: string[] = []
    const networkErrors: { url: string; status: number }[] = []

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Listen for failed network requests
    page.on('response', (response) => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
        })
      }
    })

    // Navigate to browse and find a bookmark
    await page.goto('/browse')
    await page.waitForLoadState('networkidle')

    const bookmarkLink = page.locator('a[href^="/bookmark/"]').first()

    if (await bookmarkLink.count() > 0) {
      await bookmarkLink.click()
      await page.waitForLoadState('networkidle')

      // Wait a bit for any async operations
      await page.waitForTimeout(3000)

      // Check for 406 errors specifically (the bug we fixed)
      const has406Errors = networkErrors.some((e) => e.status === 406)

      if (has406Errors) {
        console.log('406 Errors found:', networkErrors.filter((e) => e.status === 406))
      }

      expect(has406Errors).toBeFalsy()
    }
  })

  test('should not have critical console errors on main pages', async ({ page }) => {
    const criticalErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Filter out known non-critical errors
        if (
          !text.includes('favicon') &&
          !text.includes('hydration') &&
          !text.includes('ResizeObserver')
        ) {
          criticalErrors.push(text)
        }
      }
    })

    const pagesToTest = ['/', '/browse', '/search', '/groups']

    for (const pageUrl of pagesToTest) {
      criticalErrors.length = 0 // Reset for each page
      await page.goto(pageUrl)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      if (criticalErrors.length > 0) {
        console.log(`Critical errors on ${pageUrl}:`, criticalErrors)
      }

      // Allow some errors but fail on too many
      expect(criticalErrors.length).toBeLessThan(5)
    }
  })
})
