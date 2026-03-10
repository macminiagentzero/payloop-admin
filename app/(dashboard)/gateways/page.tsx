import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface GatewayResult {
  id: string
  name: string
  displayName: string
  type: string
  isActive: boolean
  isDefault: boolean
  createdAt: Date
}

export default async function GatewaysPage() {
  // Get all payment gateways
  const gateways = await prisma.$queryRaw<GatewayResult[]>`
    SELECT id, name, "displayName", type, "isActive", "isDefault", "createdAt"
    FROM "PaymentGateway"
    ORDER BY "isDefault" DESC, "createdAt" ASC
  `.catch(() => []) as GatewayResult[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Gateways</h1>
          <p className="text-slate-500 mt-1">Manage your payment processors and gateways</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/gateways/caps"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Caps
          </Link>
          <Link
            href="/gateways/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Gateway
          </Link>
        </div>
      </div>

      {gateways.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No payment gateways</h3>
          <p className="text-slate-500 mb-4">Add your first payment gateway to start processing payments.</p>
          <Link
            href="/gateways/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add Gateway
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gateways.map((gateway) => (
            <div
              key={gateway.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    gateway.type === 'STRIPE' ? 'bg-purple-100' :
                    gateway.type === 'NMI' ? 'bg-blue-100' :
                    gateway.type === 'PAYPAL' ? 'bg-yellow-100' :
                    'bg-slate-100'
                  }`}>
                    <span className="text-2xl">
                      {gateway.type === 'STRIPE' ? '💳' :
                       gateway.type === 'NMI' ? '🏦' :
                       gateway.type === 'PAYPAL' ? '🅿️' : '💳'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{gateway.displayName}</h3>
                    <p className="text-sm text-slate-500">{gateway.type}</p>
                  </div>
                </div>
                {gateway.isDefault && (
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                    Default
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  gateway.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {gateway.isActive ? 'Active' : 'Inactive'}
                </span>
                <Link
                  href={`/gateways/${gateway.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Configure →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gateway Types Info */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3">Supported Gateway Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💳</span>
            <div>
              <div className="font-medium text-slate-900">Stripe</div>
              <div className="text-sm text-slate-500">Credit cards, Apple Pay</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏦</span>
            <div>
              <div className="font-medium text-slate-900">NMI</div>
              <div className="text-sm text-slate-500">Payment processing</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🅿️</span>
            <div>
              <div className="font-medium text-slate-900">PayPal</div>
              <div className="text-sm text-slate-500">PayPal checkout</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}