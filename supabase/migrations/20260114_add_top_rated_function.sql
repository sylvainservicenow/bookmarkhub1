-- Migration: Create homepage caching infrastructure
-- This dramatically reduces egress by caching homepage data daily

-- 1. Create homepage_stats table for simple key-value stats
CREATE TABLE IF NOT EXISTS homepage_stats (
  stat_key TEXT PRIMARY KEY,
  stat_value INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create homepage_cache table for complex cached data (JSON)
CREATE TABLE IF NOT EXISTS homepage_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create efficient function to get top rated bookmarks
CREATE OR REPLACE FUNCTION get_top_rated_bookmarks(limit_count integer DEFAULT 5)
RETURNS TABLE (
  id uuid,
  title text,
  avg numeric,
  count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    b.id,
    b.title,
    ROUND(AVG(r.rating)::numeric, 1) as avg,
    COUNT(r.id) as count
  FROM bookmarks b
  INNER JOIN ratings r ON r.bookmark_id = b.id
  WHERE b.status = 'active' 
    AND b.visibility = 'public'
  GROUP BY b.id, b.title
  HAVING COUNT(r.id) >= 1
  ORDER BY AVG(r.rating) DESC, COUNT(r.id) DESC
  LIMIT limit_count;
$$;

-- 4. Grant access to tables and function
GRANT SELECT, INSERT, UPDATE ON homepage_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE ON homepage_cache TO authenticated;
GRANT SELECT ON homepage_stats TO anon;
GRANT SELECT ON homepage_cache TO anon;
GRANT EXECUTE ON FUNCTION get_top_rated_bookmarks(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_rated_bookmarks(integer) TO anon;

-- 5. Enable RLS but allow all reads (cache is public)
ALTER TABLE homepage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on homepage_stats" ON homepage_stats
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on homepage_cache" ON homepage_cache
  FOR SELECT USING (true);

-- Only service role can update cache
CREATE POLICY "Allow service role to update homepage_stats" ON homepage_stats
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to update homepage_cache" ON homepage_cache
  FOR ALL USING (auth.role() = 'service_role');

-- 6. Add comments
COMMENT ON TABLE homepage_stats IS 'Cached statistics for homepage display, refreshed daily';
COMMENT ON TABLE homepage_cache IS 'Cached complex data (trending, top rated) for homepage, refreshed daily';
COMMENT ON FUNCTION get_top_rated_bookmarks IS 'Efficiently fetch top rated bookmarks with pre-computed averages';

-- 7. Initialize with current data (one-time)
INSERT INTO homepage_stats (stat_key, stat_value)
SELECT 'bookmark_count', COUNT(*)::integer
FROM bookmarks
WHERE status = 'active'
ON CONFLICT (stat_key) DO UPDATE SET 
  stat_value = EXCLUDED.stat_value,
  updated_at = NOW();
