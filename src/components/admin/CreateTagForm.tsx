'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'

export function CreateTagForm() {
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!name.trim()) {
      setError('Tag name is required')
      return
    }

    setLoading(true)

    const { error: insertError } = await supabase
      .from('tags')
      .insert({
        name: name.trim(),
        name_normalized: name.trim().toLowerCase(),
        visibility,
        status: 'active',
      })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('A tag with this name already exists')
      } else {
        setError(insertError.message)
      }
    } else {
      setName('')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div className="flex-1">
        <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 mb-1">
          Tag Name
        </label>
        <input
          id="tagName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter tag name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>
      
      <div>
        <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
          Visibility
        </label>
        <select
          id="visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="public">Public</option>
          <option value="restricted">Restricted</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {loading ? 'Creating...' : 'Create Tag'}
      </button>

      {error && (
        <span className="text-red-600 text-sm">{error}</span>
      )}
    </form>
  )
}
