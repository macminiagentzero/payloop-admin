'use client'

import { useState } from 'react'

interface Props {
  storeId: string
  storeDomain: string
}

export default function SyncButton({ storeId, storeDomain }: Props) {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)

    try {
      const res = await fetch(`/api/stores/${storeId}/sync`, {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        setResult({ success: true, message: `Synced ${data.count || 0} products` })
        // Reload after 1 second to show updated products
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setResult({ success: false, message: data.error || 'Sync failed' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Connection error' })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
      >
        {syncing ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Syncing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync Products
          </>
        )}
      </button>

      {result && (
        <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.message}
        </span>
      )}
    </div>
  )
}