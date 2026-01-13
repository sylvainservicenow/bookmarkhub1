import { redirect } from 'next/navigation'

// Groups feature has been removed - redirect to browse
export default function GroupsPage() {
  redirect('/browse')
}
