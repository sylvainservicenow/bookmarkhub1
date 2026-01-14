-- Migration: Create efficient function to get top rated bookmarks
-- This avoids fetching ALL ratings and calculating on client side

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

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_top_rated_bookmarks(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_rated_bookmarks(integer) TO anon;

COMMENT ON FUNCTION get_top_rated_bookmarks IS 'Efficiently fetch top rated bookmarks with pre-computed averages to reduce egress';
