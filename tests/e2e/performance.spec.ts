import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.describe('Page Load Performance', () => {
    test('homepage loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000);
      console.log(`Homepage load time: ${loadTime}ms`);
    });

    test('browse page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/browse');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000);
      console.log(`Browse page load time: ${loadTime}ms`);
    });

    test('search page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/search?q=test');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000);
      console.log(`Search page load time: ${loadTime}ms`);
    });
  });

  test.describe('Core Web Vitals', () => {
    test('homepage has good LCP', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const lcpScore = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry ? (lastEntry as any).startTime : 0);
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          
          setTimeout(() => resolve(0), 5000);
        });
      });
      
      console.log(`LCP score: ${lcpScore}ms`);
      expect(Number(lcpScore)).toBeLessThan(4000);
    });

    test('page has no layout shift issues', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const clsScore = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            resolve(clsValue);
          }).observe({ type: 'layout-shift', buffered: true });
          
          setTimeout(() => resolve(clsValue), 3000);
        });
      });
      
      console.log(`CLS score: ${clsScore}`);
      expect(Number(clsScore)).toBeLessThan(0.25);
    });
  });

  test.describe('Resource Loading', () => {
    test('no broken images on homepage', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const images = await page.locator('img').all();
      let brokenImages = 0;
      
      for (const img of images) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        if (naturalWidth === 0) {
          brokenImages++;
          const src = await img.getAttribute('src');
          console.log(`Broken image: ${src}`);
        }
      }
      
      expect(brokenImages).toBe(0);
    });

    test('no console errors on homepage', async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const criticalErrors = errors.filter(e => 
        !e.includes('favicon') && 
        !e.includes('404') &&
        !e.includes('third-party')
      );
      
      if (criticalErrors.length > 0) {
        console.log('Console errors:', criticalErrors);
      }
      
      expect(criticalErrors.length).toBe(0);
    });

    test('no broken links on homepage', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const links = await page.locator('a[href]').all();
      const brokenLinks: string[] = [];
      
      for (const link of links.slice(0, 10)) {
        const href = await link.getAttribute('href');
        if (href && href.startsWith('/')) {
          const response = await page.request.get(href);
          if (response.status() >= 400) {
            brokenLinks.push(href);
          }
        }
      }
      
      if (brokenLinks.length > 0) {
        console.log('Broken links:', brokenLinks);
      }
      
      expect(brokenLinks.length).toBe(0);
    });
  });
});
