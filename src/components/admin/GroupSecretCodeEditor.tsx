'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Key, Save, Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react'

interface GroupSecretCodeEditorProps {
  groupId: string
  currentCode: string | null
}

export function GroupSecretCodeEditor({ groupId, currentCode }: GroupSecretCodeEditorProps) {
  const [code, setCode] = useState(currentCode || '')
  const [showCode, setShowCode] = useState(false)
  const [loading, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCode(result)
  }

  const handleSave = async () => {
    setSaving(true)

    const { error } = await supabase
      .from('groups')
      .update({ secret_code: code || null })
      .eq('id', groupId)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    }

    setSaving(false)
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Key className="h-4 w-4" />
        Secret Code
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showCode ? 'text' : 'password'}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="No secret code set"
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm font-mono"
          />
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button
          type="button"
          onClick={generateCode}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Generate random code"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            'Saved!'
          ) : (
            <><Save className="h-4 w-4" /> Save</>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Users with this code get streamlined approval when joining.
      </p>
    </div>
  )
}
