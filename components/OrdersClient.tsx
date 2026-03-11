'use client'

import { useState, useEffect } from 'react'
import DateRangePicker from './DateRangePicker'
import OrdersTable from './OrdersTable'

interface Order {
  id: string
  customerId: string
  amount: number
  status: string
  transactionId: string | null
  createdAt: string
  customer: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  } | null
}

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7days')

  useEffect(() => {
    fetchOrders()
  }, [dateRange])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/orders?range=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-500 mt-1">Manage all orders and transactions</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-slate-500 mt-4">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-slate-500">No orders in this time period</p>
          </div>
        ) : (
          <OrdersTable orders={orders} />
        )}
      </div>
    </div>
  )
}