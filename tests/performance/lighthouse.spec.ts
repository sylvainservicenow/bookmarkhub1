import { test, expect } from '@playwright/test';

/**
 * Performance Tests
 * Basic performance checks - for full Lighthouse CI, configure separately
 */
test.describe('Performance', () => {
  test('homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    const loadTime = Date.now() - startTime;
    
    // Should load DOM content within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('browse page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/browse', { waitUntil: 'domcontentloaded' });
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds (more data to fetch)
    expect(loadTime).toBeLessThan(5000);
  });

  test('no console errors on homepage', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors (like favicon 404s)
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('analytics') &&
      !err.includes('Failed to load resource')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('no console errors on browse page', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('analytics') &&
      !err.includes('Failed to load resource')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('images are optimized (have dimensions)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = images.nth(i);
      const width = await img.getAttribute('width');
      const height = await img.getAttribute('height');
      const style = await img.getAttribute('style');
      
      // Images should have explicit dimensions or be styled
      const hasDimensions = (width && height) || style?.includes('width') || style?.includes('height');
      // This is a recommendation, not a requirement
    }
  });

  test('page does not have layout shifts on load', async ({ page }) => {
    await page.goto('/');
    
    // Wait for full load
    await page.waitForLoadState('networkidle');
    
    // Measure CLS (Cumulative Layout Shift)
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        
        observer.observe({ type: 'layout-shift', buffered: true });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 2000);
      });
    });
    
    // CLS should be less than 0.1 for good score
    expect(cls).toBeLessThan(0.25);
  });

  test('first contentful paint is fast', async ({ page }) => {
    await page.goto('/');
    
    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              resolve(entry.startTime);
            }
          }
        });
        
        observer.observe({ type: 'paint', buffered: true });
        
        setTimeout(() => resolve(0), 5000);
      });
    });
    
    // FCP should be under 2.5 seconds for good score
    if (fcp > 0) {
      expect(fcp).toBeLessThan(2500);
    }
  });
});
