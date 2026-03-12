'use client'

import { useState } from 'react'
import { PaymentGateway } from '@prisma/client'

interface Subscription {
  id: string
  name: string
  price: number
  status: string
  gatewayId: string | null
  basisTheoryTokenId: string | null
  nmiVaultId: string | null
  nextBillDate: Date | null
  lastBillDate: Date | null
  totalBills: number
}

interface Props {
  subscription: Subscription
  gateway?: PaymentGateway | null
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

    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice })
      })

      if (!res.ok) throw new Error('Failed to update')

      setMessage({ type: 'success', text: 'Price updated!' })
      setEditing(false)
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      setMessage({ type: 'error', text: 'Failed to update price' })
    }
  }

  const handleChargeNow = async () => {
    if (!confirm(`Charge $${subscription.price.toFixed(2)} to this card now?`)) return

    setCharging(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Charge failed')

      setMessage({ type: 'success', text: `Charged! Transaction: ${data.transactionId}` })
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
    <div className="space-y-3">
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Price:</span>
          {editing ? (
            <div className="flex items-center gap-1">
              <span className="text-slate-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
              />
              <button onClick={handleSavePrice} className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Save</button>
              <button onClick={() => setEditing(false)} className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold">${(subscription.price || 0).toFixed(2)}/mo</span>
              <button onClick={() => setEditing(true)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Edit</button>
            </div>
          )}
        </div>

        {/* Gateway */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Gateway:</span>
          <span className="text-sm font-medium text-slate-700">{gatewayName}</span>
        </div>

        {/* Token Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Card:</span>
          {hasToken ? (
            <span className="text-xs text-green-600 font-medium">✓ Token saved</span>
          ) : (
            <span className="text-xs text-red-500 font-medium">✗ No token</span>
          )}
        </div>

        {/* Bills Count */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Bills:</span>
          <span className="text-sm font-medium">{subscription.totalBills || 0}</span>
        </div>

        {/* Next Bill Date */}
        {subscription.nextBillDate && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Next:</span>
            <span className="text-sm font-medium">{formatDate(subscription.nextBillDate)}</span>
          </div>
        )}
      </div>

      {/* Charge Now Button */}
      {hasToken && subscription.status === 'active' && (
        <button
          onClick={handleChargeNow}
          disabled={charging}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {charging ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : (
            <>💳 Charge Now ${subscription.price.toFixed(2)}</>
          )}
        </button>
      )}

      {!hasToken && (
        <p className="text-xs text-slate-400">No card token stored. Cannot charge.</p>
      )}
    </div>
  )
}