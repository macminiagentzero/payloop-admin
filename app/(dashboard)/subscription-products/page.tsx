import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { GatewaySelect } from '@/components/GatewaySelect'
import { getCurrentBusinessId } from '@/lib/business'

async function getSubscriptionProducts() {
  const businessId = await getCurrentBusinessId()
  
  const where: any = { isActive: true }
  if (businessId) {
    where.businessId = businessId
  }
  
  const products = await prisma.subscriptionProduct.findMany({
    where,
    orderBy: { name: 'asc' }
  })
  return products
}

async function getGateways() {
  const businessId = await getCurrentBusinessId()
  
  const where: any = { isActive: true }
  if (businessId) {
    where.businessId = businessId
  }
  
  const gateways = await prisma.paymentGateway.findMany({
    where,
    orderBy: { name: 'asc' }
  })
  return gateways
}

export default async function SubscriptionProductsPage() {
  const [products, gateways] = await Promise.all([
    getSubscriptionProducts(),
    getGateways()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription Products</h1>
          <p className="text-slate-500 mt-1">Assign payment gateways to subscription products</p>
        </div>
        <Link
          href="/subscription-products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Gateways Legend */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h3 className="text-sm font-medium text-slate-700 mb-2">Available Gateways</h3>
        <div className="flex flex-wrap gap-3">
          {gateways.map(gw => (
            <div key={gw.id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
              <span className={`w-2 h-2 rounded-full ${gw.isDefault ? 'bg-green-500' : 'bg-slate-300'}`} />
              <span className="text-sm font-medium text-slate-900">{gw.displayName || gw.name}</span>
              {gw.nmiMerchantId && (
                <span className="text-xs text-slate-500">({gw.nmiMerchantId})</span>
              )}
            </div>
          ))}
          {gateways.length === 0 && (
            <p className="text-sm text-slate-500">No gateways configured. <Link href="/gateways/new" className="text-indigo-600 hover:text-indigo-700">Add a gateway →</Link></p>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Products</h2>
        </div>
        
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No subscription products</h3>
            <p className="text-slate-500 mb-4">Add subscription products to assign them to payment gateways.</p>
            <Link
              href="/subscription-products/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Interval
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Assigned Gateway
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-slate-900">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-slate-500">{product.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-slate-900">
                        ${(product.price || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-slate-600">
                        Every {product.intervalCount || 1} {product.interval || 'month'}{(product.intervalCount || 1) > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <GatewaySelect
                        productId={product.id}
                        gatewayId={product.gatewayId}
                        gateways={gateways.map(gw => ({
                          id: gw.id,
                          name: gw.name,
                          displayName: gw.displayName,
                          isDefault: gw.isDefault
                        }))}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/subscription-products/${product.id}`}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">How MID Routing Works</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>1. Assign a gateway to each subscription product above.</p>
          <p>2. When a customer checks out with that product, the payment is routed to the assigned gateway.</p>
          <p>3. The order and subscription records will store which MID processed them.</p>
          <p>4. Use the <Link href="/gateways/caps" className="underline font-medium">MID Caps Dashboard</Link> to track volume per MID.</p>
        </div>
      </div>
    </div>
  )
}