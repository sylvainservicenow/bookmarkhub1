import { redirect } from 'next/navigation'

// Redirect old search page to new browse page
export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  // Build redirect URL with same params
  const buildRedirectUrl = async () => {
    const params = await searchParams
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v) as [string, string][]
    ).toString()
    return `/browse${queryString ? `?${queryString}` : ''}`
  }
  
  // For now, just redirect to browse
  redirect('/browse')
}
