import { prisma } from '@/lib/prisma'

export default async function SubscriptionsPage() {
  const [subscriptions, gateways] = await Promise.all([
    prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    }),
    prisma.paymentGateway.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  ])

  const gatewayMap = new Map(gateways.map(g => [g.id, g]))

  const formatDate = (date: Date | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'paused': return 'bg-yellow-100 text-yellow-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
        <p className="text-slate-500 mt-1">Manage recurring subscriptions</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {subscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">🔄</div>
            <p className="text-slate-500">No subscriptions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Subscription</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Gateway</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Next Bill</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Bills</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((sub) => {
                  const gateway = sub.gatewayId ? gatewayMap.get(sub.gatewayId) : null
                  const hasToken = sub.basisTheoryTokenId || sub.nmiVaultId
                  
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{sub.name}</div>
                        <div className="text-xs text-slate-500 font-mono">#{sub.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {sub.customer?.firstName} {sub.customer?.lastName}
                        </div>
                        <div className="text-xs text-slate-500">{sub.customer?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{formatCurrency(sub.price || 0)}</div>
                        <div className="text-xs text-slate-500">/month</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">
                          {gateway?.displayName || gateway?.name || 'Default'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(sub.status)}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(sub.nextBillDate)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {sub.totalBills || 0}
                        {!hasToken && <span className="text-red-500 ml-1">⚠️</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(sub.createdAt)}
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