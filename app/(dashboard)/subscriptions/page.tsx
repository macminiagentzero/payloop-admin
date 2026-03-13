import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<{ status?: string; gateway?: string; search?: string }> }) {
  const params = await searchParams
  
  let subscriptions: any[] = []
  let gateways: any[] = []
  
  // Build filter
  const where: any = {}
  if (params.status && params.status !== 'all') {
    where.status = params.status
  }
  if (params.gateway && params.gateway !== 'all') {
    where.gatewayId = params.gateway
  }
  if (params.search) {
    where.customer = {
      email: { contains: params.search, mode: 'insensitive' }
    }
  }
  
  try {
    subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    })
  } catch (e) {
    console.error(e)
  }

  try {
    gateways = await prisma.paymentGateway.findMany({ where: { isActive: true } })
  } catch (e) {
    console.error(e)
  }

  const gatewayMap = new Map(gateways.map(g => [g.id, g]))
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const date = (d: Date | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'

  // Calculate stats
  const allSubs = await prisma.subscription.findMany({ include: { customer: true } })
  const activeCount = allSubs.filter(s => s.status === 'active').length
  const pausedCount = allSubs.filter(s => s.status === 'paused').length
  const cancelledCount = allSubs.filter(s => s.status === 'cancelled').length
  const mrr = allSubs.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.price || 0), 0)
  const with3DS = allSubs.filter(s => s.threeDSCavv).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
              <p className="mt-1 text-sm text-gray-500">
                {allSubs.length} total · {with3DS} with 3DS protection
              </p>
            </div>
            <a
              href={`/api/subscriptions/export?${new URLSearchParams(params as any).toString()}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Active */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{activeCount}</p>
                <p className="text-sm text-emerald-600 mt-1 font-medium">{fmt(mrr)}/mo</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Paused */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Paused</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{pausedCount}</p>
                <p className="text-sm text-amber-600 mt-1">Billing suspended</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Cancelled */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{cancelledCount}</p>
                <p className="text-sm text-red-600 mt-1">No longer active</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
          </div>

          {/* 3DS Protected */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">3DS Protected</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{with3DS}</p>
                <p className="text-sm text-blue-600 mt-1">Chargeback liability shifted</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-2.332 9-7.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="p-4">
            <form method="GET" className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select 
                  name="status" 
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  defaultValue={params.status || 'all'}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Gateway</label>
                <select 
                  name="gateway" 
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  defaultValue={params.gateway || 'all'}
                >
                  <option value="all">All Gateways</option>
                  {gateways.map(g => (
                    <option key={g.id} value={g.id}>{g.displayName || g.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                <input 
                  type="text" 
                  name="search"
                  placeholder="Search by email..." 
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  defaultValue={params.search || ''}
                />
              </div>
              <div className="flex items-end gap-2 pt-5">
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
                >
                  Apply
                </button>
                {(params.status || params.gateway || params.search) && (
                  <a 
                    href="/subscriptions"
                    className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800"
                  >
                    Clear
                  </a>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Table */}
        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or create subscriptions from checkout</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gateway</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Bill</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bills</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((sub) => {
                  const gw = sub.gatewayId ? gatewayMap.get(sub.gatewayId) : null
                  const hasToken = sub.basisTheoryTokenId || sub.nmiVaultId
                  const has3DS = sub.threeDSCavv
                  
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/subscriptions/${sub.id}`} className="hover:text-indigo-600">
                          <div className="font-medium text-gray-900">{sub.name || 'Monthly Subscription'}</div>
                          <div className="text-xs text-gray-500">#{sub.id.slice(0, 8)}</div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{sub.customer?.firstName} {sub.customer?.lastName}</div>
                        <div className="text-xs text-gray-500">{sub.customer?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{fmt(sub.price || 0)}</div>
                        <div className="text-xs text-gray-500">/month</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{gw?.displayName || gw?.name || 'Default'}</div>
                        {has3DS && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-2.332 9-7.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              3DS
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sub.status === 'active' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        )}
                        {sub.status === 'paused' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Paused
                          </span>
                        )}
                        {sub.status === 'cancelled' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {date(sub.nextBillDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{sub.totalBills || 0}</span>
                        {!hasToken && (
                          <span className="ml-1 text-amber-500" title="No payment method">⚠️</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {sub.status === 'active' && (
                            <>
                              <form action={`/api/subscriptions/${sub.id}/pause`} method="POST">
                                <button 
                                  type="submit"
                                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium transition-colors"
                                >
                                  Pause
                                </button>
                              </form>
                              <form action={`/api/subscriptions/${sub.id}/cancel`} method="POST">
                                <button 
                                  type="submit"
                                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                              </form>
                            </>
                          )}
                          {sub.status === 'paused' && (
                            <form action={`/api/subscriptions/${sub.id}/resume`} method="POST">
                              <button 
                                type="submit"
                                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors"
                              >
                                Resume
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}