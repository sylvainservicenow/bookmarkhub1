import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/search/suggestions?q=search_term
 * 
 * Returns fuzzy search suggestions when the main search returns zero results.
 * 
 * OPTIMIZATION: Added edge caching for common queries.
 * Search suggestions are the same for all users, so we can cache aggressively.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const normalizedQuery = query.trim().toLowerCase()
  
  const supabase = createAdminClient()

  try {
    // Call the search_suggestions function
    const { data, error } = await supabase
      .rpc('search_suggestions', {
        search_term: normalizedQuery,
        similarity_threshold: 0.3,
        max_results: 5
      })

    if (error) {
      console.error('Error fetching suggestions:', error)
      return NextResponse.json({ suggestions: [] })
    }

    // Deduplicate and format suggestions
    const seen = new Set<string>()
    const suggestions = (data || [])
      .filter((item: { suggestion: string }) => {
        const lower = item.suggestion.toLowerCase()
        if (seen.has(lower)) return false
        seen.add(lower)
        return true
      })
      .slice(0, 5)
      .map((item: { suggestion: string; source: string; similarity_score: number }) => ({
        text: item.suggestion,
        source: item.source,
        score: item.similarity_score
      }))

    // Cache suggestions for 1 minute - same for all users
    return NextResponse.json(
      { suggestions },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    console.error('Suggestions API error:', error)
    return NextResponse.json({ suggestions: [] })
  }
}
