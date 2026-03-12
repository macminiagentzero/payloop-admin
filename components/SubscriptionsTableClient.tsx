'use client'

import { useState } from 'react'
import { Subscription, Customer, PaymentGateway } from '@prisma/client'

interface SubscriptionWithCustomer extends Subscription {
  customer: Customer | null
}

interface Props {
  subscriptions: SubscriptionWithCustomer[]
  gateways: PaymentGateway[]
}

export default function SubscriptionsTableClient({ subscriptions, gateways }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<string>('')
  const [chargingId, setChargingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getCustomerName = (customer: Customer | null) => {
    if (!customer) return 'Unknown'
    const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
    return name || customer.email
  }

  const getGatewayName = (gatewayId: string | null) => {
    if (!gatewayId) return 'Default'
    const gateway = gateways.find(g => g.id === gatewayId)
    return gateway?.displayName || gateway?.name || 'Unknown'
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const handleEditPrice = async (subscriptionId: string) => {
    if (!editPrice || isNaN(parseFloat(editPrice))) {
      setMessage({ type: 'error', text: 'Please enter a valid price' })
      return
    }

    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parseFloat(editPrice) })
      })

      if (!res.ok) throw new Error('Failed to update price')

      setMessage({ type: 'success', text: 'Price updated successfully' })
      setEditingId(null)
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update price' })
    }
  }

  const handleChargeNow = async (subscriptionId: string) => {
    if (!confirm('Charge this subscription immediately?')) return

    setChargingId(subscriptionId)
    setMessage(null)

    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Charge failed')

      setMessage({ type: 'success', text: `Charged successfully! Transaction ID: ${data.transactionId}` })
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to charge subscription' })
    } finally {
      setChargingId(null)
    }
  }

  if (subscriptions.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-4xl mb-4">🔄</div>
        <p className="text-slate-500">No subscriptions yet</p>
      </div>
    )
  }

  return (
    <div>
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Subscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Gateway
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Next Bill
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Bills
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">
                    {sub.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    #{sub.id.slice(0, 8)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-900">
                    {getCustomerName(sub.customer)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {sub.customer?.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === sub.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditPrice(sub.id)}
                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-slate-900">
                      {formatCurrency(sub.price || 0)}
                      <span className="text-xs text-slate-500 ml-1">/mo</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-700">
                    {getGatewayName(sub.gatewayId)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusClass(sub.status)}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {formatDate(sub.nextBillDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {sub.totalBills || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {formatDate(sub.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    {editingId !== sub.id && (
                      <button
                        onClick={() => {
                          setEditingId(sub.id)
                          setEditPrice(String(sub.price || 0))
                        }}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        Edit Price
                      </button>
                    )}
                    {sub.status === 'active' && (
                      <button
                        onClick={() => handleChargeNow(sub.id)}
                        disabled={chargingId === sub.id}
                        className="text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50"
                      >
                        {chargingId === sub.id ? 'Charging...' : 'Charge Now'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}