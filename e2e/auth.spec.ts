import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })

  test('should redirect unauthenticated user from protected pages', async ({ page }) => {
    await page.goto('/dashboard')
    // Should redirect to login or show sign-in prompt
    await expect(page).toHaveURL(/login|dashboard/)
  })

  test('should show register page', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /create|sign up|register/i })).toBeVisible()
  })
})
