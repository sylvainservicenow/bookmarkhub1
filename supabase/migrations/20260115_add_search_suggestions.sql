-- Migration: Add fuzzy search suggestions using pg_trgm
-- This enables "Did you mean..." functionality when searches return zero results

-- Ensure pg_trgm is available (already enabled in extensions schema)
-- The search_path should already include 'extensions' schema

-- Create GIN indexes for fast trigram similarity searches
-- These indexes dramatically speed up similarity() queries
CREATE INDEX IF NOT EXISTS idx_tags_name_trgm 
  ON tags USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_bookmarks_title_trgm 
  ON bookmarks USING GIN (title gin_trgm_ops);

-- Create function to get search suggestions
-- Returns similar terms from tags and bookmark titles
CREATE OR REPLACE FUNCTION search_suggestions(
  search_term TEXT,
  similarity_threshold FLOAT DEFAULT 0.3,
  max_results INT DEFAULT 5
)
RETURNS TABLE (
  suggestion TEXT,
  source TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH tag_suggestions AS (
    SELECT 
      t.name AS suggestion,
      'tag'::TEXT AS source,
      similarity(t.name, search_term) AS similarity_score
    FROM tags t
    WHERE t.status = 'active'
      AND similarity(t.name, search_term) > similarity_threshold
    ORDER BY similarity(t.name, search_term) DESC
    LIMIT max_results
  ),
  title_suggestions AS (
    SELECT DISTINCT
      b.title AS suggestion,
      'bookmark'::TEXT AS source,
      similarity(b.title, search_term) AS similarity_score
    FROM bookmarks b
    WHERE b.status = 'active'
      AND b.visibility = 'public'
      AND similarity(b.title, search_term) > similarity_threshold
    ORDER BY similarity(b.title, search_term) DESC
    LIMIT max_results
  )
  SELECT * FROM tag_suggestions
  UNION ALL
  SELECT * FROM title_suggestions
  ORDER BY similarity_score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION search_suggestions(TEXT, FLOAT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_suggestions(TEXT, FLOAT, INT) TO anon;

COMMENT ON FUNCTION search_suggestions IS 
  'Returns fuzzy search suggestions for "Did you mean..." functionality. '
  'Uses pg_trgm similarity matching on tags and bookmark titles.';
