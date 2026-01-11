import { test, expect } from '@playwright/test';

/**
 * Authentication Tests
 * Verifies login, registration, and protected routes
 */
test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check for email input
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Check for password input
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('registration page renders correctly', async ({ page }) => {
    await page.goto('/register');
    
    // Should have name/email/password fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('invalid login shows error', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/error|invalid|incorrect/i')).toBeVisible({ timeout: 10000 });
  });

  test('protected routes redirect to login', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('submit page requires authentication', async ({ page }) => {
    await page.goto('/submit');
    
    // Should either show login form or redirect
    const isRedirected = page.url().includes('/login');
    const hasLoginPrompt = await page.locator('text=/sign in|log in/i').isVisible();
    
    expect(isRedirected || hasLoginPrompt).toBe(true);
  });

  test('favorites page requires authentication', async ({ page }) => {
    await page.goto('/favorites');
    await expect(page).toHaveURL(/\/login/);
  });

  test('settings page requires authentication', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });
});
