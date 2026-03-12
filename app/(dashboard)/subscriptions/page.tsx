import { prisma } from '@/lib/prisma'

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

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Subscriptions</h1>
      
      {subscriptions.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border text-center">
          <p className="text-gray-500">No subscriptions yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
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
              </tr>
            </thead>
            <tbody className="divide-y">
              {subscriptions.map((sub) => {
                const gw = sub.gatewayId ? gatewayMap.get(sub.gatewayId) : null
                const hasToken = sub.basisTheoryTokenId || sub.nmiVaultId
                
                return (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{sub.name}</p>
                      <p className="text-xs text-gray-500">#{sub.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{sub.customer?.firstName} {sub.customer?.lastName}</p>
                      <p className="text-xs text-gray-500">{sub.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{fmt(sub.price || 0)}/mo</td>
                    <td className="px-4 py-3">{gw?.displayName || gw?.name || 'Default'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{date(sub.nextBillDate)}</td>
                    <td className="px-4 py-3">
                      {sub.totalBills || 0}
                      {!hasToken && <span className="text-red-500 ml-1">⚠️</span>}
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