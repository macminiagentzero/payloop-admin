import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      paymentMethod: true,
    },
  })

  if (!order) {
    notFound()
  }

  // Parse items JSON
  let items = []
  try {
    items = JSON.parse(order.items || '[]')
  } catch {
    items = []
  }

  // Get gateway info if gatewayId exists
  let gateway = null
  if (order.gatewayId) {
    // gatewayId might be a UUID or a name like 'nmi-rcdronez'
    const isUuid = order.gatewayId.includes('-') && order.gatewayId.length > 20
    gateway = await prisma.paymentGateway.findFirst({
      where: isUuid 
        ? { id: order.gatewayId }
        : { name: order.gatewayId }
    })
  }

  // Get subscriptions for this customer
  const subscriptions = order.customerId 
    ? await prisma.subscription.findMany({
        where: { customerId: order.customerId },
      })
    : []

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'declined':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        ← Back to Orders
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="text-slate-500 mt-1">
            Created {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className={`inline-flex px-4 py-2 rounded-lg text-sm font-semibold capitalize border ${getStatusClass(order.status)}`}>
          {order.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Customer</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Name</label>
              <p className="text-slate-900 font-medium">
                {order.customer?.firstName} {order.customer?.lastName}
              </p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Email</label>
              <p className="text-slate-900">{order.customer?.email}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Phone</label>
              <p className="text-slate-900">{order.customer?.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Address</label>
              <p className="text-slate-900">
                {order.customer?.address}<br />
                {order.customer?.city}, {order.customer?.state} {order.customer?.zip}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-900">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tax</span>
              <span className="text-slate-900">{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Shipping</span>
              <span className="text-slate-900">{formatCurrency(order.shipping)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-200">
              <span className="text-slate-900 font-semibold">Total</span>
              <span className="text-slate-900 font-bold text-lg">{formatCurrency(order.total)}</span>
            </div>
            {order.nmiTransactionId && (
              <div className="pt-3 border-t border-slate-200">
                <label className="text-xs text-slate-500 uppercase tracking-wider">Transaction ID</label>
                <p className="font-mono text-sm text-slate-900">{order.nmiTransactionId}</p>
              </div>
            )}
            {order.nmiAuthCode && (
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Auth Code</label>
                <p className="font-mono text-sm text-slate-900">{order.nmiAuthCode}</p>
              </div>
            )}
            {gateway && (
              <div className="pt-3 border-t border-slate-200">
                <label className="text-xs text-slate-500 uppercase tracking-wider">Payment Gateway</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {gateway.displayName || gateway.name}
                  </span>
                  {gateway.nmiMerchantId && (
                    <span className="text-xs text-slate-500 font-mono">
                      (MID: {gateway.nmiMerchantId})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Items ({items.length})</h2>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
                    📦
                  </div>
                )}
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
      </div>

      {/* Subscriptions */}
      {subscriptions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Subscriptions</h2>
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{sub.name}</p>
                  <p className="text-sm text-slate-500 capitalize">{sub.status}</p>
                </div>
                <Link
                  href={`/subscriptions/${sub.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {order.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-red-700">{order.errorMessage}</p>
        </div>
      )}
    </div>
  )
}