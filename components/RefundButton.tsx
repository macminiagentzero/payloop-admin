'use client'

import { useState } from 'react'

interface Props {
  orderId: string
  transactionId?: string
  amount: number
  label?: string
}

export default function RefundButton({ orderId, transactionId, amount, label = 'Refund' }: Props) {
  const [loading, setLoading] = useState(false)

  const handleRefund = async () => {
    if (!confirm('Are you sure you want to refund this transaction?')) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transactionId,
          amount,
          reason: 'Requested by admin' 
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        alert(`Refund failed: ${data.error || 'Unknown error'}`)
        return
      }
      
      alert('Refund successful!')
      window.location.reload()
    } catch (err: any) {
      alert(`Refund failed: ${err.message || 'Network error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRefund}
      disabled={loading}
      className="px-2 py-1 text-xs font-medium rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Processing...' : label}
    </button>
  )
}