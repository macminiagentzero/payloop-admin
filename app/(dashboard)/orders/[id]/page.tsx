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
    include: { customer: true },
  })

  if (!order) notFound()

  let items: any[] = []
  try { items = JSON.parse(order.items || '[]') } catch { items = [] }

  let gateway = null
  if (order.gatewayId) {
    gateway = await prisma.paymentGateway.findFirst({
      where: { OR: [{ id: order.gatewayId }, { name: order.gatewayId }] }
    }).catch(() => null)
  }

  let subscriptions: any[] = []
  try {
    subscriptions = await prisma.subscription.findMany({
      where: { customerId: order.customerId },
      orderBy: { createdAt: 'desc' }
    })
  } catch (e) {
    console.error(e)
  }

  let gateways: any[] = []
  try {
    gateways = await prisma.paymentGateway.findMany()
  } catch (e) {
    console.error(e)
  }
  const gatewayMap = new Map(gateways.map(g => [g.id, g]))

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const date = (d: Date) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="space-y-6 p-6">
      <Link href="/orders" className="text-blue-600 hover:underline">← Back to Orders</Link>
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-gray-500">{date(order.createdAt)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${order.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="font-semibold mb-3">Customer</h2>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">Name:</span> {order.customer?.firstName} {order.customer?.lastName}</p>
            <p><span className="text-gray-500">Email:</span> {order.customer?.email}</p>
            <p><span className="text-gray-500">Phone:</span> {order.customer?.phone || '—'}</p>
            <p><span className="text-gray-500">Address:</span> {order.customer?.address}, {order.customer?.city}, {order.customer?.state} {order.customer?.zip}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h2 className="font-semibold mb-3">Payment</h2>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between"><span className="text-gray-500">Subtotal</span> <span>{fmt(order.subtotal)}</span></p>
            <p className="flex justify-between"><span className="text-gray-500">Tax</span> <span>{fmt(order.tax)}</span></p>
            <p className="flex justify-between"><span className="text-gray-500">Shipping</span> <span>{fmt(order.shipping)}</span></p>
            <p className="flex justify-between font-semibold border-t pt-1 mt-1"><span>Total</span> <span>{fmt(order.total)}</span></p>
            {order.nmiTransactionId && <p className="text-xs text-gray-500 mt-2">TX: {order.nmiTransactionId}</p>}
            {gateway && <p className="text-xs"><span className="text-gray-500">Gateway:</span> <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{gateway.displayName || gateway.name}</span></p>}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <h2 className="font-semibold mb-3">Items ({items.length})</h2>
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity} × {fmt(item.price)}</p>
                </div>
                <p className="font-medium">{fmt(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-500 text-center py-4">No items</p>}
      </div>

      {subscriptions.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="font-semibold mb-3">Subscriptions ({subscriptions.length})</h2>
          <div className="space-y-3">
            {subscriptions.map((sub) => {
              const gw = sub.gatewayId ? gatewayMap.get(sub.gatewayId) : null
              const hasToken = sub.basisTheoryTokenId || sub.nmiVaultId
              
              return (
                <div key={sub.id} className="p-3 bg-purple-50 rounded border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{sub.name}</p>
                      <p className="text-xs text-gray-500">#{sub.id.slice(0, 8)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {sub.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-sm mb-2">
                    <div><span className="text-gray-500">Price:</span> <span className="font-medium">${(sub.price || 0).toFixed(2)}/mo</span></div>
                    <div><span className="text-gray-500">Gateway:</span> <span>{gw?.displayName || gw?.name || 'Default'}</span></div>
                    <div><span className="text-gray-500">Card:</span> <span className={hasToken ? 'text-green-600' : 'text-red-500'}>{hasToken ? '✓ Saved' : '✗ Missing'}</span></div>
                    <div><span className="text-gray-500">Bills:</span> <span>{sub.totalBills || 0}</span></div>
                  </div>

                  <div className="flex gap-2">
                    <a href={`/orders/${order.id}/subscription/${sub.id}/edit`} className="text-sm text-blue-600 hover:underline">Edit Price</a>
                    {hasToken && sub.status === 'active' && (
                      <span className="text-gray-300">|</span>
                    )}
                    {hasToken && sub.status === 'active' && (
                      <a href={`/orders/${order.id}/subscription/${sub.id}/charge`} className="text-sm text-green-600 hover:underline">Charge Now</a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}