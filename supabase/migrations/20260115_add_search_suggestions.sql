-- Migration: Add fuzzy search suggestions using pg_trgm
-- This enables "Did you mean..." functionality when searches return zero results
-- 
-- Features:
-- - Tag name matching
-- - Bookmark title matching  
-- - Word-level extraction from titles (catches words like "Agents" from longer titles)

-- Create GIN indexes for fast trigram similarity searches
-- These indexes dramatically speed up similarity() queries
CREATE INDEX IF NOT EXISTS idx_tags_name_trgm 
  ON tags USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_bookmarks_title_trgm 
  ON bookmarks USING GIN (title gin_trgm_ops);

-- Create function to get search suggestions
-- Returns similar terms from tags, bookmark titles, and extracted keywords
CREATE OR REPLACE FUNCTION search_suggestions(
  search_term TEXT,
  similarity_threshold FLOAT DEFAULT 0.25,
  max_results INT DEFAULT 5
)
RETURNS TABLE (
  suggestion TEXT,
  source TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT sub.suggestion, sub.source, sub.similarity_score
  FROM (
    -- Tag suggestions
    SELECT 
      t.name::TEXT AS suggestion,
      'tag'::TEXT AS source,
      similarity(t.name, search_term)::FLOAT AS similarity_score
    FROM tags t
    WHERE t.status = 'active'
      AND similarity(t.name, search_term) > similarity_threshold
    
    UNION
    
    -- Bookmark title suggestions
    SELECT 
      b.title::TEXT AS suggestion,
      'bookmark'::TEXT AS source,
      similarity(b.title, search_term)::FLOAT AS similarity_score
    FROM bookmarks b
    WHERE b.status = 'active'
      AND b.visibility = 'public'
      AND similarity(b.title, search_term) > similarity_threshold

    UNION

    -- Word-level matching: extract words from titles that match the search term
    -- This catches typos like "agends" -> "Agents" from titles containing that word
    SELECT DISTINCT
      word::TEXT AS suggestion,
      'keyword'::TEXT AS source,
      similarity(word, search_term)::FLOAT AS similarity_score
    FROM bookmarks b,
         LATERAL unnest(string_to_array(regexp_replace(b.title, '[^a-zA-Z0-9 ]', '', 'g'), ' ')) AS word
    WHERE b.status = 'active'
      AND b.visibility = 'public'
      AND length(word) > 3
      AND similarity(word, search_term) > similarity_threshold
  ) sub
  ORDER BY sub.similarity_score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION search_suggestions(TEXT, FLOAT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_suggestions(TEXT, FLOAT, INT) TO anon;

COMMENT ON FUNCTION search_suggestions IS 
  'Returns fuzzy search suggestions for "Did you mean..." functionality. '
  'Uses pg_trgm similarity matching on tags, bookmark titles, and extracted keywords from titles.';
