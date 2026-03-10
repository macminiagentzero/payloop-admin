import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

async function getGateway(id: string) {
  try {
    const gateway = await prisma.paymentGateway.findUnique({
      where: { id }
    })
    return gateway
  } catch {
    return null
  }
}

export default async function GatewayConfigPage({ params }: Props) {
  const { id } = await params
  const gateway = await getGateway(id)
  
  if (!gateway) {
    notFound()
  }

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
          <h1 className="text-2xl font-bold text-slate-900">{gateway.displayName}</h1>
          <p className="text-slate-500 mt-1">{gateway.type.toUpperCase()} Gateway Configuration</p>
        </div>
        <div className="flex items-center gap-2">
          {gateway.isActive ? (
            <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
              Active
            </span>
          ) : (
            <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-slate-100 text-slate-600">
              Inactive
            </span>
          )}
          {gateway.isDefault && (
            <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-700">
              Default
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Gateway Settings</h2>
        </div>
        
        <form id="gateway-form" className="p-6 space-y-6">
          <input type="hidden" name="gatewayId" value={gateway.id} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gateway Name
              </label>
              <input
                type="text"
                name="name"
                defaultValue={gateway.name}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., rcdronez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                defaultValue={gateway.displayName || ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., RCDRONEZ.COM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gateway Type
              </label>
              <select
                name="type"
                defaultValue={gateway.type}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="NMI">NMI / Seamless Chex</option>
                <option value="STRIPE">Stripe</option>
                <option value="PAYPAL">PayPal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Merchant ID
              </label>
              <input
                type="text"
                name="merchantId"
                defaultValue={gateway.nmiMerchantId || ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., 500001750"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Monthly Cap (USD)
              </label>
              <input
                type="number"
                name="monthlyCap"
                defaultValue={gateway.monthlyCap || ''}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., 100000 for $100k/month"
              />
              <p className="mt-1 text-sm text-slate-500">
                Maximum monthly processing volume for this MID
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              API Endpoint
            </label>
            <input
              type="text"
              name="endpoint"
              defaultValue={gateway.nmiEndpoint || ''}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://seamlesschex.transactiongateway.com/api/transact.php"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Security Key
            </label>
            <input
              type="password"
              name="securityKey"
              defaultValue=""
              placeholder="Leave blank to keep existing key"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {gateway.nmiSecurityKey && (
              <p className="mt-1 text-sm text-slate-500">
                Current key: ••••••••{gateway.nmiSecurityKey.slice(-4)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={gateway.isActive}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">Active</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isDefault"
                defaultChecked={gateway.isDefault}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">Default Gateway</span>
            </label>
          </div>
        </form>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          form="gateway-form"
          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Save Changes
        </button>
        <button
          type="button"
          id="test-connection-btn"
          className="px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          Test Connection
        </button>
        <Link
          href="/gateways"
          className="px-6 py-2 text-slate-600 hover:text-slate-800"
        >
          Cancel
        </Link>
      </div>
    </div>
  )
}