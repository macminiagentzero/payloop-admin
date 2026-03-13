import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function SubscriptionsPage() {
  let subscriptions: any[] = []
  let gateways: any[] = []
  
  try {
    subscriptions = await prisma.subscription.findMany({
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
  const activeCount = subscriptions.filter(s => s.status === 'active').length
  const pausedCount = subscriptions.filter(s => s.status === 'paused').length
  const cancelledCount = subscriptions.filter(s => s.status === 'cancelled').length
  const mrr = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.price || 0), 0)
  const with3DS = subscriptions.filter(s => s.threeDSCavv).length

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <div className="text-sm text-gray-500">
          {subscriptions.length} total · {with3DS} with 3DS protection
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500 mb-1">Active</div>
          <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          <div className="text-xs text-gray-400 mt-1">
            {fmt(mrr)}/mo revenue
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500 mb-1">Paused</div>
          <div className="text-2xl font-bold text-yellow-600">{pausedCount}</div>
          <div className="text-xs text-gray-400 mt-1">
            Billing suspended
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500 mb-1">Cancelled</div>
          <div className="text-2xl font-bold text-red-600">{cancelledCount}</div>
          <div className="text-xs text-gray-400 mt-1">
            No longer active
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500 mb-1">3DS Protected</div>
          <div className="text-2xl font-bold text-blue-600">{with3DS}</div>
          <div className="text-xs text-gray-400 mt-1">
            Chargeback liability shifted
          </div>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border text-center">
          <p className="text-gray-500">No subscriptions yet</p>
          <p className="text-sm text-gray-400 mt-2">Subscriptions are created when customers complete checkout</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-4">
            <select className="text-sm border rounded px-2 py-1">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="text-sm border rounded px-2 py-1">
              <option value="">All Gateways</option>
              {gateways.map(g => (
                <option key={g.id} value={g.id}>{g.displayName || g.name}</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Search by email..." 
              className="text-sm border rounded px-3 py-1 flex-1 max-w-xs"
            />
          </div>
          
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gateway</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Bill</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bills</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subscriptions.map((sub) => {
                const gw = sub.gatewayId ? gatewayMap.get(sub.gatewayId) : null
                const hasToken = sub.basisTheoryTokenId || sub.nmiVaultId
                const has3DS = sub.threeDSCavv
                
                return (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/subscriptions/${sub.id}`} className="hover:text-indigo-600">
                        <p className="font-medium">{sub.name || 'Monthly Subscription'}</p>
                        <p className="text-xs text-gray-500">#{sub.id.slice(0, 8)}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{sub.customer?.firstName} {sub.customer?.lastName}</p>
                      <p className="text-xs text-gray-500">{sub.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{fmt(sub.price || 0)}/mo</td>
                    <td className="px-4 py-3">
                      <p>{gw?.displayName || gw?.name || 'Default'}</p>
                      {has3DS && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-2.332 9-7.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          3DS
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sub.status === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Active
                        </span>
                      )}
                      {sub.status === 'paused' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                          Paused
                        </span>
                      )}
                      {sub.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{date(sub.nextBillDate)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{sub.totalBills || 0}</span>
                      {!hasToken && <span className="text-red-500 ml-1" title="No payment method">⚠️</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {sub.status === 'active' && (
                          <>
                            <form action={`/api/subscriptions/${sub.id}/pause`} method="POST">
                              <button 
                                type="submit"
                                className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                              >
                                Pause
                              </button>
                            </form>
                            <form action={`/api/subscriptions/${sub.id}/cancel`} method="POST">
                              <button 
                                type="submit"
                                className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
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
                              className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100"
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
  )
}