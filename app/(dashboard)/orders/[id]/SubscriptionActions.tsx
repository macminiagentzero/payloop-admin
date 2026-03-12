'use client'

import { useState } from 'react'

interface Subscription {
  id: string
  name: string
  price: number
  status: string
  gatewayId: string | null
  basisTheoryTokenId: string | null
  nmiVaultId: string | null
  nextBillDate: Date | null
  totalBills: number
}

interface Gateway {
  id: string
  name: string
  displayName: string | null
}

interface Props {
  subscription: Subscription
  gateway?: Gateway | null
}

export default function SubscriptionActions({ subscription, gateway }: Props) {
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState(String(subscription.price || 0))
  const [charging, setCharging] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const hasToken = subscription.basisTheoryTokenId || subscription.nmiVaultId
  const gatewayName = gateway?.displayName || gateway?.name || 'Default'

  const handleSavePrice = async () => {
    const newPrice = parseFloat(price)
    if (isNaN(newPrice) || newPrice < 0) {
      setMessage({ type: 'error', text: 'Invalid price' })
      return
    }

    setEditing(false)
    setMessage(null)

    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice })
      })

      if (!res.ok) throw new Error('Failed')

      setMessage({ type: 'success', text: 'Price updated!' })
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      setMessage({ type: 'error', text: 'Failed to update' })
    }
  }

  const handleChargeNow = async () => {
    if (!confirm(`Charge $${(subscription.price || 0).toFixed(2)} now?`)) return

    setCharging(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}/charge`, {
        method: 'POST'
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed')

      setMessage({ type: 'success', text: `Charged! TX: ${data.transactionId}` })
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Charge failed' })
    } finally {
      setCharging(false)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-slate-900">{subscription.name}</div>
          <div className="text-xs text-slate-500">#{subscription.id.slice(0, 8)}</div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
          subscription.status === 'active' ? 'bg-green-100 text-green-700' :
          subscription.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {subscription.status}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
        <div>
          <span className="text-slate-500">Price:</span>
          {editing ? (
            <span className="ml-2">
              $<input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-20 px-1 py-0.5 border rounded text-sm"
              />
              <button onClick={handleSavePrice} className="ml-1 text-green-600 hover:text-green-700">✓</button>
              <button onClick={() => setEditing(false)} className="ml-1 text-slate-400 hover:text-slate-600">✕</button>
            </span>
          ) : (
            <span className="ml-2 font-semibold">${(subscription.price || 0).toFixed(2)}/mo
              <button onClick={() => setEditing(true)} className="ml-2 text-indigo-600 hover:text-indigo-700 text-xs">Edit</button>
            </span>
          )}
        </div>
        <div><span className="text-slate-500">Gateway:</span> <span className="ml-2">{gatewayName}</span></div>
        <div><span className="text-slate-500">Card:</span> <span className={`ml-2 ${hasToken ? 'text-green-600' : 'text-red-500'}`}>{hasToken ? '✓ Saved' : '✗ Missing'}</span></div>
        <div><span className="text-slate-500">Bills:</span> <span className="ml-2">{subscription.totalBills || 0}</span></div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-3 p-2 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Charge Button */}
      {hasToken && subscription.status === 'active' && (
        <button
          onClick={handleChargeNow}
          disabled={charging}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {charging ? 'Processing...' : `Charge Now $${(subscription.price || 0).toFixed(2)}`}
        </button>
      )}
    </div>
  )
}