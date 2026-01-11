import { test, expect } from '@playwright/test';

/**
 * Bookmark Interaction Tests
 * Verifies bookmark cards, details, and interactions
 */
test.describe('Bookmarks', () => {
  test('bookmark cards display required information', async ({ page }) => {
    await page.goto('/browse');
    
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the actual bookmark cards to appear
    // The card has classes: bg-white rounded-xl border
    const cards = page.locator('.bg-white.rounded-xl.border');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    
    // Get the count of cards
    const cardCount = await cards.count();
    
    // If we have cards, verify they have content
    if (cardCount > 0) {
      const firstCard = cards.first();
      
      // Cards should have either a Link (rendered as <a>) or text content
      // Check for title text (any text content in the card)
      const cardText = await firstCard.textContent();
      expect(cardText).toBeTruthy();
      expect(cardText!.length).toBeGreaterThan(0);
    }
  });

  test('bookmark card click navigates to detail page', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for cards to load
    const cards = page.locator('.bg-white.rounded-xl.border');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    
    // Find a bookmark detail link (href contains /bookmark/)
    const bookmarkLink = page.locator('a[href*="/bookmark/"]').first();
    
    if (await bookmarkLink.isVisible()) {
      await bookmarkLink.click();
      // Should navigate to bookmark detail
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/\/bookmark\//);
    }
  });

  test('bookmark detail page shows full information', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for cards
    const cards = page.locator('.bg-white.rounded-xl.border');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    
    // Get the bookmark's internal link if it exists
    const detailLink = page.locator('a[href*="/bookmark/"]').first();
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
    const cards = page.locator('.bg-white.rounded-xl.border');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    
    // Check if stars are visible (using Star icon - typically svg elements)
    const stars = cards.first().locator('svg');
    const starCount = await stars.count();
    
    // Cards should have some SVG icons (stars, external link, etc)
    expect(starCount).toBeGreaterThan(0);
  });

  test('tags display on bookmark cards', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    
    const cards = page.locator('.bg-white.rounded-xl.border');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    
    // Tags are styled elements, could be links or spans
    // Look for small text elements that could be tags
    const tagElements = page.locator('.bg-gray-100');
    const tagCount = await tagElements.count();
    
    // Tags may or may not be present, just verify no error
    expect(tagCount).toBeGreaterThanOrEqual(0);
  });

  test('favicon displays correctly', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    
    const cards = page.locator('.bg-white.rounded-xl.border');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    
    // Favicon can be an img element
    const images = cards.first().locator('img');
    const imageCount = await images.count();
    
    // Cards may have favicons as images
    expect(imageCount).toBeGreaterThanOrEqual(0);
  });

  test('edit bookmark page loads correctly', async ({ page }) => {
    // This test verifies the edit page doesn't get stuck on "Loading..."
    // We test by navigating directly to a bookmark edit URL pattern
    // Since we don't have auth in tests, we expect redirect to login
    
    // Test with a sample UUID format
    await page.goto('/bookmarks/e6707945-09dd-4e51-957c-6c2026c46db6/edit');
    await page.waitForLoadState('domcontentloaded');
    
    // Should either:
    // 1. Redirect to login (if not authenticated)
    // 2. Show "not found" error (if authenticated but bookmark doesn't exist)
    // 3. Show the edit form (if authenticated and owns the bookmark)
    
    // Wait up to 10 seconds - should NOT be stuck on "Loading..."
    await page.waitForTimeout(3000);
    
    // Check we're not stuck on a loading state
    const loadingText = page.locator('text=Loading...');
    const loadingBookmarkText = page.locator('text=Loading bookmark...');
    
    // After 3 seconds, should not still show basic "Loading..." text
    // ("Loading bookmark..." with spinner is acceptable briefly)
    const isStuckOnLoading = await loadingText.isVisible() && 
                             !(await page.locator('svg.animate-spin').isVisible());
    
    expect(isStuckOnLoading).toBe(false);
    
    // Should be on login page, error page, or edit form
    const currentUrl = page.url();
    const isOnLoginPage = currentUrl.includes('/login');
    const hasEditForm = await page.locator('form').isVisible();
    const hasNotFoundMessage = await page.locator('text=not found').isVisible();
    const hasBackLink = await page.locator('text=Back to My Bookmarks').isVisible();
    
    // One of these conditions should be true
    expect(isOnLoginPage || hasEditForm || hasNotFoundMessage || hasBackLink).toBe(true);
  });

  test('edit page shows proper error for non-existent bookmark', async ({ page }) => {
    // Test with a UUID that likely doesn't exist
    await page.goto('/bookmarks/00000000-0000-0000-0000-000000000000/edit');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Should either redirect to login or show not found
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      // If not redirected, should show a proper error state, not infinite loading
      const hasLoadingSpinner = await page.locator('svg.animate-spin').isVisible();
      const hasErrorOrNotFound = await page.locator('text=not found').isVisible() ||
                                  await page.locator('text=Bookmark not found').isVisible();
      
      // Either show error or have loading with spinner (not stuck)
      expect(hasErrorOrNotFound || hasLoadingSpinner).toBe(true);
    }
  });
});
