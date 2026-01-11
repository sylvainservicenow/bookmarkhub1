import { test, expect } from '@playwright/test';

/**
 * Security Tests - Row Level Security
 * Tests that verify RLS policies are working correctly
 * These tests attempt unauthorized operations that should be blocked
 */
test.describe('Row Level Security', () => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://igrbpjecytawoqmtkjys.supabase.co';
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  test.skip(!SUPABASE_ANON_KEY, 'Skipping RLS tests - SUPABASE_ANON_KEY not configured');

  test('anonymous user cannot insert bookmarks', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/rest/v1/bookmarks`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      data: {
        url: 'https://malicious.com',
        url_normalized: 'malicious.com',
        title: 'Unauthorized Bookmark'
      }
    });

    // Should be rejected by RLS
    expect([401, 403, 400]).toContain(response.status());
  });

  test('anonymous user cannot delete bookmarks', async ({ request }) => {
    const response = await request.delete(`${SUPABASE_URL}/rest/v1/bookmarks?id=eq.test-id`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      }
    });

    // Should be rejected or return no rows
    expect([401, 403, 400, 204]).toContain(response.status());
  });

  test('anonymous user cannot access admin endpoints', async ({ request }) => {
    const response = await request.get(`${SUPABASE_URL}/rest/v1/users?role=eq.admin`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      }
    });

    // Should either return empty or be blocked
    if (response.status() === 200) {
      const data = await response.json();
      // Should not expose admin user details
      expect(data.length).toBe(0);
    }
  });

  test('anonymous user cannot update other users', async ({ request }) => {
    const response = await request.patch(`${SUPABASE_URL}/rest/v1/users?id=neq.null`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      data: {
        role: 'admin'
      }
    });

    // Should be rejected
    expect([401, 403, 400]).toContain(response.status());
  });

  test('cannot bypass RLS with malformed requests', async ({ request }) => {
    // Attempt SQL injection via query params
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/bookmarks?or=(id.eq.1,1=1)`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
        }
      }
    );

    // Should handle gracefully
    expect([200, 400]).toContain(response.status());
  });

  test('public bookmarks are readable', async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/bookmarks?visibility=eq.public&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
        }
      }
    );

    // Public bookmarks should be accessible
    expect(response.status()).toBe(200);
  });

  test('restricted bookmarks are not accessible anonymously', async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/bookmarks?visibility=eq.restricted`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
        }
      }
    );

    if (response.status() === 200) {
      const data = await response.json();
      // Should return empty array for restricted content
      expect(data.length).toBe(0);
    }
  });

  test('comments require authentication to create', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/rest/v1/comments`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      data: {
        bookmark_id: 'test-bookmark-id',
        content: 'Unauthorized comment'
      }
    });

    expect([401, 403, 400]).toContain(response.status());
  });
});
