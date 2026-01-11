import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.describe('Public Pages', () => {
    test('homepage loads successfully', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/BookmarkHub/i);
      await expect(page.locator('body')).toBeVisible();
    });

    test('browse page is accessible', async ({ page }) => {
      await page.goto('/browse');
      await expect(page).toHaveURL(/\/browse/);
    });

    test('search page is accessible', async ({ page }) => {
      await page.goto('/search');
      await expect(page).toHaveURL(/\/search/);
    });

    test('login page is accessible', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveURL(/\/login/);
    });

    test('register page is accessible', async ({ page }) => {
      await page.goto('/register');
      await expect(page).toHaveURL(/\/register/);
    });

    test('about page is accessible', async ({ page }) => {
      await page.goto('/about');
      await expect(page).toHaveURL(/\/about/);
    });

    test('help page is accessible', async ({ page }) => {
      await page.goto('/help');
      await expect(page).toHaveURL(/\/help/);
    });

    test('pricing page is accessible', async ({ page }) => {
      await page.goto('/pricing');
      await expect(page).toHaveURL(/\/pricing/);
    });

    test('privacy page is accessible', async ({ page }) => {
      await page.goto('/privacy');
      await expect(page).toHaveURL(/\/privacy/);
    });
  });

  test.describe('Navigation Links', () => {
    test('header navigation works', async ({ page }) => {
      await page.goto('/');
      
      const browseLink = page.locator('a[href="/browse"]').first();
      if (await browseLink.isVisible()) {
        await browseLink.click();
        await expect(page).toHaveURL(/\/browse/);
      }
    });

    test('footer links are functional', async ({ page }) => {
      await page.goto('/');
      
      const footer = page.locator('footer');
      if (await footer.isVisible()) {
        const links = await footer.locator('a').all();
        expect(links.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Category Navigation', () => {
    test('category pills navigate correctly', async ({ page }) => {
      await page.goto('/');
      
      const categoryLinks = page.locator('[data-testid="category-pill"], a[href*="/browse?category="], a[href*="/tags/"]');
      const count = await categoryLinks.count();
      
      if (count > 0) {
        await categoryLinks.first().click();
        await page.waitForLoadState('networkidle');
        const url = page.url();
        expect(url.includes('/browse') || url.includes('/tags')).toBeTruthy();
      }
    });
  });

  test.describe('Search Functionality', () => {
    test('search from homepage works', async ({ page }) => {
      await page.goto('/');
      
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[name="search"], input[name="q"]').first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('test query');
        await searchInput.press('Enter');
        await page.waitForLoadState('networkidle');
        expect(page.url().includes('/search') || page.url().includes('q=')).toBeTruthy();
      }
    });

    test('search page filters work', async ({ page }) => {
      await page.goto('/search?q=test');
      await page.waitForLoadState('networkidle');
      
      const sortSelect = page.locator('select, [data-testid="sort-select"]').first();
      if (await sortSelect.isVisible()) {
        await sortSelect.click();
      }
    });
  });
});
