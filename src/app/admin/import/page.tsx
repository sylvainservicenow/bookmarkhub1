'use client'

import { useState } from 'react'
import { Upload, CheckCircle, XCircle, Loader2, FileJson } from 'lucide-react'

export default function ImportBookmarksPage() {
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [jsonData, setJsonData] = useState('')

  const handleImport = async () => {
    setImporting(true)
    setError(null)
    setResults(null)

    try {
      const bookmarks = JSON.parse(jsonData)
      
      if (!Array.isArray(bookmarks)) {
        throw new Error('JSON must be an array of bookmarks')
      }

      const response = await fetch('/api/admin/import-bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarks })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setJsonData(event.target?.result as string)
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Upload className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Import Bookmarks</h1>
          <p className="text-gray-600 mt-2">Bulk import bookmarks from JSON data</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileJson className="h-4 w-4" />
              Upload JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          {/* JSON Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or paste JSON data
            </label>
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              rows={10}
              placeholder='[{"url": "https://...", "title": "...", "groupName": null, "tags": ["Tag1"]}]'
              className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={importing || !jsonData}
            className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Import Bookmarks
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Import Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="font-medium text-green-800">Import Complete</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-2xl font-bold text-gray-900">{results.total}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-600">{results.imported}</p>
                  <p className="text-sm text-gray-500">Imported</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-2xl font-bold text-yellow-600">{results.skipped}</p>
                  <p className="text-sm text-gray-500">Skipped</p>
                </div>
              </div>
              {results.errors?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-red-700 mb-2">Errors ({results.errors.length}):</p>
                  <div className="max-h-32 overflow-y-auto text-xs text-red-600 bg-red-50 p-2 rounded">
                    {results.errors.map((err: string, i: number) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">JSON Format</h3>
          <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto">
{`[
  {
    "url": "https://example.com/resource",
    "title": "Resource Title",
    "description": "Optional description",
    "groupName": null,  // or "ServiceNow Sales" | "ServiceNow Employees" | "ServiceNow Partners"
    "tags": ["App Engine", "Low-Code"]
  }
]`}
          </pre>
        </div>
      </div>
    </div>
  )
}
