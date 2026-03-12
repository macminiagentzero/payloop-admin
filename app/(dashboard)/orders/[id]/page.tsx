import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string }>
}

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { success, error } = await searchParams
  
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
  const time = (d: Date) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const statusColors: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    declined: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/orders" className="inline-flex items-center text-slate-500 hover:text-slate-700 mb-4 transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
              <p className="text-slate-500 mt-1">{date(order.createdAt)} at {time(order.createdAt)}</p>
            </div>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${statusColors[order.status] || statusColors.pending}`}>
              {order.status === 'approved' ? (
                <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : null}
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start">
            <svg className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-emerald-700 font-medium">{decodeURIComponent(success)}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
            <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 font-medium">{decodeURIComponent(error)}</p>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900">Customer</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                  {order.customer?.firstName?.[0] || '?'}{order.customer?.lastName?.[0] || ''}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{order.customer?.firstName} {order.customer?.lastName}</p>
                  <p className="text-sm text-slate-500">{order.customer?.email}</p>
                </div>
              </div>
              {order.customer?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-slate-600">{order.customer.phone}</span>
                </div>
              )}
              <div className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-slate-600">{order.customer?.address}, {order.customer?.city}, {order.customer?.state} {order.customer?.zip}</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900">Payment Summary</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-900">{fmt(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax</span>
                  <span className="text-slate-900">{fmt(order.tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Shipping</span>
                  <span className="text-slate-900">{fmt(order.shipping)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-slate-900">{fmt(order.total)}</span>
                  </div>
                </div>
              </div>
              
              {(order.nmiTransactionId || gateway) && (
                <div className="mt-6 pt-6 border-t border-slate-200 space-y-2">
                  {order.nmiTransactionId && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">Transaction ID</span>
                      <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">{order.nmiTransactionId}</code>
                    </div>
                  )}
                  {gateway && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">Gateway</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                        {gateway.displayName || gateway.name}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Items</h2>
            <span className="text-sm text-slate-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          </div>
          {items.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {items.map((item, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">Qty {item.quantity} × {fmt(item.price)}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-slate-900">{fmt(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">No items</div>
          )}
        </div>

        {/* Subscriptions */}
        {subscriptions.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900">Subscriptions</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {subscriptions.map((sub) => {
                const gw = sub.gatewayId ? gatewayMap.get(sub.gatewayId) : null
                const hasToken = sub.basisTheoryTokenId || sub.nmiVaultId
                
                return (
                  <div key={sub.id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-slate-900">{sub.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            sub.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : sub.status === 'paused'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Price</span>
                            <span className="font-semibold text-slate-900">{fmt(sub.price || 0)}/mo</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Gateway</span>
                            <span className="text-slate-700">{gw?.displayName || gw?.name || 'Default'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Card</span>
                            {hasToken ? (
                              <span className="flex items-center text-emerald-600">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Saved
                              </span>
                            ) : (
                              <span className="flex items-center text-red-500">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Missing
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Bills</span>
                            <span className="text-slate-900 font-medium">{sub.totalBills || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a 
                          href={`/orders/${order.id}/subscription/${sub.id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Edit Price
                        </a>
                        {hasToken && sub.status === 'active' && (
                          <a 
                            href={`/orders/${order.id}/subscription/${sub.id}/charge`}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Charge Now
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {order.errorMessage && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900">Payment Error</h3>
                <p className="text-red-700 text-sm mt-1">{order.errorMessage}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}