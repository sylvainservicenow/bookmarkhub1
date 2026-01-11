import { test, expect } from '@playwright/test';

/**
 * Authentication Tests
 * Tests login, logout, and protected route access
 */
test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Should show login form
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login form validation works', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // HTML5 validation should prevent submission
    // Check that we're still on the login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('protected routes redirect to login', async ({ page }) => {
    // Try to access dashboard without being logged in
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login.*redirect=/);
  });

  test('protected route /bookmarks redirects to login', async ({ page }) => {
    await page.goto('/bookmarks');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL(/\/login.*redirect=/);
  });

  test('protected route /submit redirects to login', async ({ page }) => {
    await page.goto('/submit');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL(/\/login.*redirect=/);
  });

  test('protected route /favorites redirects to login', async ({ page }) => {
    await page.goto('/favorites');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL(/\/login.*redirect=/);
  });

  test('protected route /settings redirects to login', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL(/\/login.*redirect=/);
  });

  test('public routes do not redirect', async ({ page }) => {
    // Homepage should be accessible
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/\/login/);
    
    // Browse page should be accessible
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('bookmark detail page is accessible without login', async ({ page }) => {
    // First go to browse to find a bookmark
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for cards to load
    const bookmarkLink = page.locator('a[href*="/bookmark/"]').first();
    
    if (await bookmarkLink.isVisible({ timeout: 5000 })) {
      await bookmarkLink.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Should stay on bookmark page, not redirect to login
      await expect(page).toHaveURL(/\/bookmark\//);
      await expect(page).not.toHaveURL(/\/login/);
      
      // Should show the bookmark content
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('login page shows sign-in prompt for interactions', async ({ page }) => {
    // Go to a bookmark page
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');
    
    const bookmarkLink = page.locator('a[href*="/bookmark/"]').first();
    
    if (await bookmarkLink.isVisible({ timeout: 5000 })) {
      await bookmarkLink.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Should show sign-in prompt for interactions
      const signInPrompt = page.locator('text=Sign in');
      await expect(signInPrompt.first()).toBeVisible();
    }
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('text=Create an account')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('navigation between login and register works', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Click sign up link
    await page.click('text=Sign up');
    await expect(page).toHaveURL(/\/register/);
    
    // Click sign in link
    await page.click('text=Sign in');
    await expect(page).toHaveURL(/\/login/);
  });

  test('header shows login/signup for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for auth loading to complete
    await page.waitForTimeout(2000);
    
    // Should show login and signup buttons
    const loginButton = page.locator('header a[href="/login"]');
    const signupButton = page.locator('header a[href="/register"]');
    
    await expect(loginButton).toBeVisible();
    await expect(signupButton).toBeVisible();
  });
});
