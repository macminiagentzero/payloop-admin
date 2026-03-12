import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  
  // Fetch order with customer
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true },
  })

  if (!order) {
    notFound()
  }

  // Parse items
  let items: any[] = []
  try {
    items = JSON.parse(order.items || '[]')
  } catch {
    items = []
  }

  // Get gateway
  let gateway = null
  if (order.gatewayId) {
    gateway = await prisma.paymentGateway.findFirst({
      where: {
        OR: [
          { id: order.gatewayId },
          { name: order.gatewayId },
          { name: order.gatewayId.replace(/^(nmi-|stripe-)/, '') }
        ]
      }
    })
  }

  // Get subscriptions for this customer
  const subscriptions = order.customerId 
    ? await prisma.subscription.findMany({
        where: { customerId: order.customerId },
        orderBy: { createdAt: 'desc' }
      })
    : []

  // Get all gateways for subscription display
  const gateways = await prisma.paymentGateway.findMany()
  const gatewayMap = new Map(gateways.map(g => [g.id, g]))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200'
      case 'declined': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/orders" className="text-slate-600 hover:text-slate-900">
        ← Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="text-slate-500 mt-1">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <span className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize border ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer */}
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Customer</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-slate-500 uppercase">Name</dt>
              <dd className="text-slate-900 font-medium">{order.customer?.firstName} {order.customer?.lastName}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 uppercase">Email</dt>
              <dd className="text-slate-900">{order.customer?.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 uppercase">Phone</dt>
              <dd className="text-slate-900">{order.customer?.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 uppercase">Address</dt>
              <dd className="text-slate-900">
                {order.customer?.address}<br />
                {order.customer?.city}, {order.customer?.state} {order.customer?.zip}
              </dd>
            </div>
          </dl>
        </section>

        {/* Payment */}
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="text-slate-900">{formatCurrency(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Tax</dt>
              <dd className="text-slate-900">{formatCurrency(order.tax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Shipping</dt>
              <dd className="text-slate-900">{formatCurrency(order.shipping)}</dd>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-200">
              <dt className="text-slate-900 font-semibold">Total</dt>
              <dd className="text-slate-900 font-bold text-lg">{formatCurrency(order.total)}</dd>
            </div>
            {order.nmiTransactionId && (
              <div className="pt-3 border-t border-slate-200">
                <dt className="text-xs text-slate-500 uppercase">Transaction ID</dt>
                <dd className="font-mono text-sm">{order.nmiTransactionId}</dd>
              </div>
            )}
            {gateway && (
              <div className="pt-3 border-t border-slate-200">
                <dt className="text-xs text-slate-500 uppercase">Gateway</dt>
                <dd className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {gateway.displayName || gateway.name}
                  </span>
                  {gateway.nmiMerchantId && (
                    <span className="text-xs text-slate-500 font-mono">(MID: {gateway.nmiMerchantId})</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      {/* Items */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Items ({items.length})
        </h2>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-2xl">
                  📦
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                </div>
                <div className="font-semibold text-slate-900">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">No items</p>
        )}
      </section>

      {/* Subscriptions */}
      {subscriptions.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Subscriptions ({subscriptions.length})
          </h2>
          <div className="space-y-4">
            {subscriptions.map((sub) => {
              const subGateway = sub.gatewayId ? gatewayMap.get(sub.gatewayId) : null
              const hasToken = sub.basisTheoryTokenId || sub.nmiVaultId
              
              return (
                <div key={sub.id} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{sub.name}</p>
                      <p className="text-xs text-slate-500">ID: {sub.id.slice(0, 8)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      sub.status === 'active' ? 'bg-green-100 text-green-700' :
                      sub.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                  
                  {/* Subscription Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-slate-500">Price:</span>
                      <span className="ml-2 font-semibold">${(sub.price || 0).toFixed(2)}/mo</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Gateway:</span>
                      <span className="ml-2">{subGateway?.displayName || subGateway?.name || 'Default'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Card:</span>
                      <span className={`ml-2 ${hasToken ? 'text-green-600' : 'text-red-500'}`}>
                        {hasToken ? '✓ Saved' : '✗ Missing'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Bills:</span>
                      <span className="ml-2">{sub.totalBills || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/api/subscriptions/${sub.id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Edit Price →
                    </a>
                    {hasToken && sub.status === 'active' && (
                      <form action={`/api/subscriptions/${sub.id}/charge`} method="POST">
                        <button
                          type="submit"
                          className="text-sm text-green-600 hover:text-green-700 font-medium"
                          onClick={(e) => {
                            if (!confirm(`Charge $${(sub.price || 0).toFixed(2)} now?`)) {
                              e.preventDefault()
                            }
                          }}
                        >
                          Charge Now
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Error */}
      {order.errorMessage && (
        <section className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-red-700">{order.errorMessage}</p>
        </section>
      )}
    </div>
  )
}