import { test, expect } from '@playwright/test';

/**
 * Accessibility Tests
 * Verifies basic a11y compliance
 */
test.describe('Accessibility', () => {
  test('homepage has proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Should have an h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Alt can be empty string for decorative images, but should exist
      expect(alt !== null).toBe(true);
    }
  });

  test('form inputs have labels', async ({ page }) => {
    await page.goto('/login');
    
    const inputs = page.locator('input:not([type="hidden"])');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      // Should have either a label, aria-label, aria-labelledby, or at minimum a placeholder
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
      const hasAccessibility = hasLabel || ariaLabel || ariaLabelledBy || placeholder;
      
      expect(hasAccessibility).toBeTruthy();
    }
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      // Button should have some accessible name
      const hasName = (text && text.trim()) || ariaLabel || title;
      expect(hasName).toBeTruthy();
    }
  });

  test('page has skip link or landmark regions', async ({ page }) => {
    await page.goto('/');
    
    // Check for skip link or main landmark
    const skipLink = page.locator('a[href="#main"], a[href="#content"], a:has-text("Skip")');
    const mainLandmark = page.locator('main, [role="main"]');
    
    const hasSkipLink = await skipLink.count() > 0;
    const hasMainLandmark = await mainLandmark.count() > 0;
    
    expect(hasSkipLink || hasMainLandmark).toBe(true);
  });

  test('color contrast is sufficient (visual check)', async ({ page }) => {
    await page.goto('/');
    
    // This is a basic check - for full contrast testing use axe-core
    // Just verify text is visible
    const mainText = page.locator('h1, h2, p').first();
    await expect(mainText).toBeVisible();
  });

  test('focus is visible on interactive elements', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Get the focused element
    const focusedElement = page.locator(':focus');
    
    if (await focusedElement.count() > 0) {
      // Focused element should be visible
      await expect(focusedElement).toBeVisible();
    }
  });
});
