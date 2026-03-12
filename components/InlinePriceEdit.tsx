'use client'

import { useState } from 'react'

interface Props {
  subscriptionId: string
  orderId: string
  currentPrice: number
}

export default function InlinePriceEdit({ subscriptionId, orderId, currentPrice }: Props) {
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState(currentPrice.toFixed(2))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const newPrice = parseFloat(price)
    if (isNaN(newPrice) || newPrice < 0) {
      return
    }

    setSaving(true)

    try {
      await fetch(`/api/subscriptions/${subscriptionId}/edit-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `price=${newPrice}&orderId=${orderId}`
      })
    } finally {
      // Always reload - the price is saved even if we get a redirect
      window.location.reload()
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-slate-500">$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setEditing(false)
          }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-2 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded disabled:opacity-50"
        >
          {saving ? '...' : 'Save'}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-slate-900">{fmt(currentPrice)}/mo</span>
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
      >
        Edit
      </button>
    </div>
  )
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)