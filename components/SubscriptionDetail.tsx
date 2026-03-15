'use client'

import { useState } from 'react'

interface Subscription {
  id: string
  name: string
  price: number
  status: string
  billingMode: string
  billingInterval: number
  billingIntervalUnit: string
  nextBillDate: Date | null
  lastBillDate: Date | null
  retryCount: number
  maxRetries: number
  pausedAt: Date | null
  cancelledAt: Date | null
  cancelReason: string | null
  customer: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  business: {
    id: string
    name: string
  }
  order: {
    id: string
    cardLast4: string
    cardType: string
  }
  _count?: {
    transactions: number
  }
}

interface Props {
  subscription: Subscription
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-green-100 text-green-800', label: 'Active' },
    paused: { color: 'bg-yellow-100 text-yellow-800', label: 'Paused' },
    past_due: { color: 'bg-orange-100 text-orange-800', label: 'Past Due' },
    cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
  }
  
  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status }
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

// Billing mode badge
function BillingModeBadge({ mode }: { mode: string }) {
  const isAuto = mode === 'automatic'
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
      isAuto ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
    }`}>
      {isAuto ? 'Automatic' : 'Manual'}
    </span>
  )
}

export default function SubscriptionDetail({ subscription }: Props) {
  const [loading, setLoading] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const handlePause = async () => {
    if (!confirm('Pause this subscription? Billing will stop until resumed.')) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}/pause`, { method: 'POST' })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to pause subscription')
      }
    } catch (error) {
      alert('Failed to pause subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleResume = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}/resume`, { method: 'POST' })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to resume subscription')
      }
    } catch (error) {
      alert('Failed to resume subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Please enter a reason for cancellation')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      alert('Failed to cancel subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleChargeNow = async () => {
    if (!confirm(`Charge $${subscription.price.toFixed(2)} now?`)) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}/charge`, { method: 'POST' })
      const data = await res.json()
      
      if (res.ok) {
        alert(`Charged $${subscription.price.toFixed(2)} successfully!`)
        window.location.reload()
      } else {
        alert(data.error || 'Charge failed')
      }
    } catch (error) {
      alert('Failed to process charge')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status and Billing Mode */}
      <div className="flex items-center gap-4">
        <StatusBadge status={subscription.status} />
        <BillingModeBadge mode={subscription.billingMode} />
      </div>

      {/* Billing Schedule */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Billing Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500">Last Charge</p>
            <p className="text-sm font-medium text-slate-900">
              {subscription.lastBillDate 
                ? new Date(subscription.lastBillDate).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Next Charge</p>
            <p className="text-sm font-medium text-slate-900">
              {subscription.nextBillDate 
                ? new Date(subscription.nextBillDate).toLocaleDateString()
                : '—'}
            </p>
          </div>
          {subscription.status === 'past_due' && (
            <div>
              <p className="text-xs text-slate-500">Retry Count</p>
              <p className="text-sm font-medium text-orange-600">
                {subscription.retryCount} / {subscription.maxRetries}
              </p>
            </div>
          )}
          {subscription.pausedAt && (
            <div>
              <p className="text-xs text-slate-500">Paused On</p>
              <p className="text-sm font-medium text-slate-900">
                {new Date(subscription.pausedAt).toLocaleDateString()}
              </p>
            </div>
          )}
          {subscription.cancelledAt && (
            <div>
              <p className="text-xs text-slate-500">Cancelled On</p>
              <p className="text-sm font-medium text-red-600">
                {new Date(subscription.cancelledAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Actions</h3>
        <div className="flex flex-wrap gap-3">
          {subscription.status === 'active' && (
            <>
              <button
                onClick={handlePause}
                disabled={loading}
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 disabled:opacity-50"
              >
                Pause
              </button>
              <button
                onClick={handleChargeNow}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Charge Now
              </button>
            </>
          )}
          
          {subscription.status === 'paused' && (
            <button
              onClick={handleResume}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Resume
            </button>
          )}
          
          {subscription.status === 'past_due' && (
            <>
              <button
                onClick={handleChargeNow}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                Retry Charge
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={loading}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
          
          {subscription.status === 'active' && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={loading}
              className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Cancel Subscription</h3>
            <p className="text-slate-600 mb-4">
              This will permanently cancel the subscription. The customer will not be charged again.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason for cancellation
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Customer requested, payment issues, etc."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCancel}
                disabled={loading || !cancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}