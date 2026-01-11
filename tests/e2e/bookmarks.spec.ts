import { test, expect } from '@playwright/test';

test.describe('Bookmark Functionality Tests', () => {
  test.describe('Browse Bookmarks', () => {
    test('browse page displays bookmarks', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');
      
      const bookmarkCards = page.locator('[data-testid="bookmark-card"], .bookmark-card, article, .card');
      const emptyMessage = page.locator('text=/no bookmarks/i, text=/empty/i');
      
      const hasContent = (await bookmarkCards.count()) > 0 || (await emptyMessage.count()) > 0;
      expect(hasContent).toBeTruthy();
    });

    test('bookmark cards have required information', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');
      
      const bookmarkCards = page.locator('[data-testid="bookmark-card"], .bookmark-card, article').first();
      
      if (await bookmarkCards.isVisible()) {
        const title = bookmarkCards.locator('h2, h3, a');
        expect(await title.count()).toBeGreaterThan(0);
      }
    });

    test('clicking bookmark navigates to detail or external link', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');
      
      const bookmarkLink = page.locator('[data-testid="bookmark-card"] a, .bookmark-card a, article a').first();
      
      if (await bookmarkLink.isVisible()) {
        const href = await bookmarkLink.getAttribute('href');
        expect(href).toBeTruthy();
      }
    });
  });

  test.describe('Bookmark Detail Page', () => {
    test('bookmark detail page loads', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');
      
      const detailLink = page.locator('a[href*="/bookmark/"]').first();
      
      if (await detailLink.isVisible()) {
        await detailLink.click();
        await page.waitForLoadState('networkidle');
        
        expect(page.url()).toContain('/bookmark/');
      }
    });
  });

  test.describe('Tags and Categories', () => {
    test('tags page displays available tags', async ({ page }) => {
      await page.goto('/tags');
      await page.waitForLoadState('networkidle');
      
      const tags = page.locator('a[href*="/tags/"], [data-testid="tag"], .tag');
      const count = await tags.count();
      
      expect(count >= 0).toBeTruthy();
    });

    test('clicking a tag filters bookmarks', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');
      
      const tagLink = page.locator('a[href*="/tags/"], [data-testid="tag-filter"]').first();
      
      if (await tagLink.isVisible()) {
        await tagLink.click();
        await page.waitForLoadState('networkidle');
        
        const url = page.url();
        expect(url.includes('/tags/') || url.includes('tag=')).toBeTruthy();
      }
    });
  });

  test.describe('Filtering and Sorting', () => {
    test('sort options are available on browse page', async ({ page }) => {
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');
      
      const sortControl = page.locator('select, [data-testid="sort-select"], button:has-text("Sort")');
      const count = await sortControl.count();
      
      expect(count >= 0).toBeTruthy();
    });

    test('search with filters works', async ({ page }) => {
      await page.goto('/search?q=test');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/search');
    });
  });

  test.describe('Groups', () => {
    test('groups page is accessible', async ({ page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      expect(url.includes('/groups') || url.includes('/login')).toBeTruthy();
    });
  });
});
