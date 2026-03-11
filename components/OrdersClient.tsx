'use client'

import { useState, useEffect } from 'react'
import DateRangePicker from './DateRangePicker'
import OrdersTable from './OrdersTable'
import { Order, Customer } from '@prisma/client'

interface OrderWithCustomer extends Order {
  customer: Customer | null
}

export default function OrdersClient() {
  const [orders, setOrders] = useState<OrderWithCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7days')
  const [customStartDate, setCustomStartDate] = useState<string | undefined>()
  const [customEndDate, setCustomEndDate] = useState<string | undefined>()

  useEffect(() => {
    fetchOrders()
  }, [dateRange, customStartDate, customEndDate])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      let url = `/api/orders?range=${dateRange}`
      
      if (dateRange === 'custom' && customStartDate && customEndDate) {
        url = `/api/orders?startDate=${customStartDate}&endDate=${customEndDate}`
      }
      
      const response = await fetch(url)
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

  const handleDateChange = (value: string, startDate?: string, endDate?: string) => {
    setDateRange(value)
    if (value === 'custom' && startDate && endDate) {
      setCustomStartDate(startDate)
      setCustomEndDate(endDate)
    } else {
      setCustomStartDate(undefined)
      setCustomEndDate(undefined)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-500 mt-1">Manage all orders and transactions</p>
        </div>
        <DateRangePicker 
          value={dateRange} 
          onChange={handleDateChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
        />
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