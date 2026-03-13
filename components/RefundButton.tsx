'use client'

import { useState } from 'react'

interface Props {
  orderId: string
  orderTotal: number
}

export default function RefundButton({ orderId, orderTotal }: Props) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleRefund = async () => {
    if (!confirm('Are you sure you want to refund this order?')) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Requested by admin' })
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
      setShowConfirm(false)
    }
  }

  return (
    <button
      onClick={handleRefund}
      disabled={loading}
      className="px-4 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Processing...' : 'Refund Order'}
    </button>
  )
}