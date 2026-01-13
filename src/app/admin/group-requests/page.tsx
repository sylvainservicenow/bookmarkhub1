import { redirect } from 'next/navigation'

// Groups feature has been removed - redirect to admin
export default function AdminGroupRequestsPage() {
  redirect('/admin')
}
