import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import SubscriptionActions from './SubscriptionActions'

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

  // Get gateway (simple query)
  let gateway = null
  if (order.gatewayId) {
    try {
      gateway = await prisma.paymentGateway.findFirst({
        where: {
          OR: [
            { id: order.gatewayId },
            { name: order.gatewayId }
          ]
        }
      })
    } catch (e) {
      console.error('Gateway query error:', e)
    }
  }

  // Get subscriptions for this customer
  let subscriptions: any[] = []
  try {
    subscriptions = await prisma.subscription.findMany({
      where: { customerId: order.customerId },
      orderBy: { createdAt: 'desc' }
    })
  } catch (e) {
    console.error('Subscriptions query error:', e)
  }

  // Get all gateways for mapping
  let gateways: any[] = []
  try {
    gateways = await prisma.paymentGateway.findMany()
  } catch (e) {
    console.error('Gateways query error:', e)
  }
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
          <p className="text-slate-500 mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize border ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      {/* Customer & Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer */}
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Customer</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-slate-500">Name:</span> <span className="font-medium ml-2">{order.customer?.firstName} {order.customer?.lastName}</span></div>
            <div><span className="text-slate-500">Email:</span> <span className="ml-2">{order.customer?.email}</span></div>
            <div><span className="text-slate-500">Phone:</span> <span className="ml-2">{order.customer?.phone || '—'}</span></div>
            <div><span className="text-slate-500">Address:</span> <span className="ml-2">{order.customer?.address}, {order.customer?.city}, {order.customer?.state} {order.customer?.zip}</span></div>
          </div>
        </section>

        {/* Payment */}
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{formatCurrency(order.tax)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span>{formatCurrency(order.shipping)}</span></div>
            <div className="flex justify-between pt-2 border-t font-semibold"><span>Total</span><span className="text-lg">{formatCurrency(order.total)}</span></div>
            {order.nmiTransactionId && <div className="pt-2 border-t"><span className="text-slate-500">Transaction:</span> <span className="font-mono ml-2">{order.nmiTransactionId}</span></div>}
            {gateway && <div><span className="text-slate-500">Gateway:</span> <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700">{gateway.displayName || gateway.name}</span></div>}
          </div>
        </section>
      </div>

      {/* Items */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Items ({items.length})</h2>
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-slate-500">Qty: {item.quantity} × {formatCurrency(item.price)}</div>
                </div>
                <div className="font-semibold">{formatCurrency(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">No items</p>
        )}
      </section>

      {/* Subscriptions */}
      {subscriptions.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Subscriptions ({subscriptions.length})</h2>
          <div className="space-y-4">
            {subscriptions.map((sub) => {
              const subGateway = sub.gatewayId ? gatewayMap.get(sub.gatewayId) : null
              return (
                <SubscriptionActions 
                  key={sub.id} 
                  subscription={sub} 
                  gateway={subGateway} 
                />
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