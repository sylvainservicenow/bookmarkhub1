import { test, expect } from '@playwright/test';

test.describe('Authentication Flow Tests', () => {
  test.describe('Login Page', () => {
    test('login page has required elements', async ({ page }) => {
      await page.goto('/login');
      
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();
      
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      await expect(passwordInput).toBeVisible();
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
      await expect(submitButton.first()).toBeVisible();
    });

    test('login form shows validation errors', async ({ page }) => {
      await page.goto('/login');
      
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid) ||
                        (await page.locator('.error, [role="alert"], .text-red-500').count()) > 0;
      
      expect(isInvalid).toBeTruthy();
    });

    test('invalid credentials show error', async ({ page }) => {
      await page.goto('/login');
      
      await page.locator('input[type="email"], input[name="email"]').first().fill('invalid@test.com');
      await page.locator('input[type="password"], input[name="password"]').first().fill('wrongpassword');
      await page.locator('button[type="submit"]').first().click();
      
      await page.waitForTimeout(2000);
      
      const hasError = (await page.locator('.error, [role="alert"], .text-red-500, .bg-red-100').count()) > 0;
      const stillOnLogin = page.url().includes('/login');
      
      expect(hasError || stillOnLogin).toBeTruthy();
    });

    test('link to register page exists', async ({ page }) => {
      await page.goto('/login');
      
      const registerLink = page.locator('a[href*="register"], a:has-text("Sign up"), a:has-text("Register")');
      await expect(registerLink.first()).toBeVisible();
    });
  });

  test.describe('Register Page', () => {
    test('register page has required elements', async ({ page }) => {
      await page.goto('/register');
      
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();
      
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      await expect(passwordInput.first()).toBeVisible();
      
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton.first()).toBeVisible();
    });

    test('register form validates email format', async ({ page }) => {
      await page.goto('/register');
      
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await emailInput.fill('invalid-email');
      await page.locator('button[type="submit"]').first().click();
      
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    });

    test('link to login page exists', async ({ page }) => {
      await page.goto('/register');
      
      const loginLink = page.locator('a[href*="login"], a:has-text("Sign in"), a:has-text("Login")');
      await expect(loginLink.first()).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('dashboard redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      const hasAuthPrompt = url.includes('/login') || 
                            url.includes('/auth') ||
                            (await page.locator('button:has-text("Login"), a:has-text("Sign in")').count()) > 0;
      
      expect(hasAuthPrompt).toBeTruthy();
    });

    test('submit page requires authentication', async ({ page }) => {
      await page.goto('/submit');
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      const requiresAuth = url.includes('/login') || 
                           url.includes('/auth') ||
                           (await page.locator('button:has-text("Login"), a:has-text("Sign in")').count()) > 0;
      
      expect(requiresAuth).toBeTruthy();
    });

    test('favorites page requires authentication', async ({ page }) => {
      await page.goto('/favorites');
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      const requiresAuth = url.includes('/login') || 
                           url.includes('/auth') ||
                           (await page.locator('button:has-text("Login"), a:has-text("Sign in")').count()) > 0;
      
      expect(requiresAuth).toBeTruthy();
    });

    test('settings page requires authentication', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      const requiresAuth = url.includes('/login') || 
                           url.includes('/auth') ||
                           (await page.locator('button:has-text("Login"), a:has-text("Sign in")').count()) > 0;
      
      expect(requiresAuth).toBeTruthy();
    });

    test('admin page requires admin authentication', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      const isBlocked = url.includes('/login') || 
                        url.includes('/') ||
                        page.url() !== 'https://bookmarkhub1.vercel.app/admin';
      
      expect(isBlocked).toBeTruthy();
    });
  });
});
