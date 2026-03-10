'use client'

import { useState, useEffect } from 'react'
import DateRangePicker from '@/components/DateRangePicker'

interface Order {
  id: string
  total: number
  status: string
  createdAt: string
  customer: {
    firstName: string
    lastName: string
    email: string
  }
}

interface Stats {
  totalRevenue: number
  totalOrders: number
  approvedOrders: number
  declinedOrders: number
  totalCustomers: number
  activeSubscriptions: number
  approvalRate: number
  declineRate: number
  avgOrderValue: number
}

interface ChartData {
  date: string
  total: number
}

export default function DashboardClient() {
  const [dateRange, setDateRange] = useState('7days')
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/stats?range=${dateRange}`)
        const data = await res.json()
        setStats(data.stats)
        setOrders(data.recentOrders)
        setChartData(data.chartData)
      } catch (e) {
        console.error('Failed to fetch stats:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [dateRange])
  
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  const maxChartValue = Math.max(...chartData.map(d => d.total), 1)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's your PayLoop overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-2">{stats?.approvedOrders || 0} approved orders</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Orders</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.totalOrders || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              <div className="flex gap-4 mt-2">
                <span className="text-sm text-green-600">{stats?.approvalRate || 0}% approved</span>
                <span className="text-sm text-red-600">{stats?.declineRate || 0}% declined</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Customers</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.totalCustomers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-2">{stats?.activeSubscriptions || 0} active subscriptions</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Avg Order</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats?.avgOrderValue || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-2">Per transaction</p>
            </div>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue</h3>
              <div className="h-64 flex items-end gap-1">
                {chartData.slice(-14).map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-indigo-500 rounded-t transition-all hover:bg-indigo-600"
                      style={{ height: `${(d.total / maxChartValue) * 100}%`, minHeight: d.total > 0 ? '4px' : '0' }}
                      title={`$${d.total.toFixed(2)}`}
                    />
                    <span className="text-xs text-slate-400 truncate w-full text-center">
                      {formatDate(d.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Approval Rate</span>
                  <span className="font-semibold text-green-600">{stats?.approvalRate || 0}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Decline Rate</span>
                  <span className="font-semibold text-red-600">{stats?.declineRate || 0}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Avg Order Value</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(stats?.avgOrderValue || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Subscription Rate</span>
                  <span className="font-semibold text-purple-600">
                    {stats?.totalCustomers && stats.totalCustomers > 0 
                      ? Math.round(((stats.activeSubscriptions || 0) / stats.totalCustomers) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
              <a href="/orders" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View all →
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No orders in this date range
                      </td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {order.customer.firstName} {order.customer.lastName}
                          <div className="text-xs text-slate-400">{order.customer.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === 'approved' 
                              ? 'bg-green-100 text-green-700' 
                              : order.status === 'declined'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}