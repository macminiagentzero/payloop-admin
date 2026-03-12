import { prisma } from '@/lib/prisma'
import Link from 'next/link'

async function getGatewayCaps() {
  // Get all gateways
  const gateways = await prisma.paymentGateway.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })

  // Get start of current month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get MTD volume per gateway from orders
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startOfMonth
      },
      status: 'approved'
    },
    select: {
      gatewayId: true,
      total: true
    }
  })

  // Sum volume per gateway
  const volumeByGateway: Record<string, number> = {}
  for (const order of orders) {
    const gid = order.gatewayId || 'unknown'
    volumeByGateway[gid] = (volumeByGateway[gid] || 0) + (order.total || 0)
  }

  // Combine data
  return gateways.map(gateway => {
    const mtdVolume = volumeByGateway[gateway.id] || 0
    // monthlyCap not in database yet, default to 0
    const cap = (gateway as any).monthlyCap || 0
    const remaining = cap > 0 ? cap - mtdVolume : null
    const percentUsed = cap > 0 ? (mtdVolume / cap) * 100 : 0

    return {
      id: gateway.id,
      name: gateway.name,
      displayName: gateway.displayName || gateway.name,
      merchantId: gateway.nmiMerchantId,
      monthlyCap: cap,
      mtdVolume,
      remaining,
      percentUsed,
      isDefault: gateway.isDefault
    }
  })
}

export default async function GatewayCapsPage() {
  const caps = await getGatewayCaps()

  // Calculate totals
  const totalCap = caps.reduce((sum, g) => sum + (g.monthlyCap || 0), 0)
  const totalMTD = caps.reduce((sum, g) => sum + g.mtdVolume, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/gateways"
          className="text-slate-500 hover:text-slate-700"
        >
          ← Back to Gateways
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">MID Monthly Caps</h1>
          <p className="text-slate-500 mt-1">Track monthly processing volume per MID</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500">Total Cap Capacity</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            ${totalCap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500">MTD Processed</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            ${totalMTD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500">Remaining Capacity</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            ${(totalCap - totalMTD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Gateway Caps Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Gateway Volume</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Gateway
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  MID
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Monthly Cap
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  MTD Volume
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Usage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {caps.map((gateway) => (
                <tr key={gateway.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{gateway.displayName}</span>
                      {gateway.isDefault && (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                          Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {gateway.merchantId || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {gateway.monthlyCap > 0 ? (
                      <span className="font-medium text-slate-900">
                        ${gateway.monthlyCap.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-slate-400">Not set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="font-medium text-indigo-600">
                      ${gateway.mtdVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {gateway.remaining !== null ? (
                      <span className={`font-medium ${gateway.remaining < 0 ? 'text-red-600' : gateway.remaining < gateway.monthlyCap * 0.2 ? 'text-yellow-600' : 'text-green-600'}`}>
                        ${gateway.remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            gateway.percentUsed >= 100 ? 'bg-red-500' : 
                            gateway.percentUsed >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(gateway.percentUsed, 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${
                        gateway.percentUsed >= 100 ? 'text-red-600' : 
                        gateway.percentUsed >= 80 ? 'text-yellow-600' : 'text-slate-600'
                      }`}>
                        {gateway.percentUsed.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No gateways message */}
      {caps.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No active gateways configured.</p>
          <Link href="/gateways/new" className="text-indigo-600 hover:text-indigo-700 mt-2 inline-block">
            Add a gateway →
          </Link>
        </div>
      )}
    </div>
  )
}