import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ id: string; subscriptionId: string }>
}

export default async function ChargeSubscription({ params }: Props) {
  const { id, subscriptionId } = await params
  
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { customer: true }
  })

  if (!subscription) notFound()

  const gateway = subscription.gatewayId 
    ? await prisma.paymentGateway.findFirst({
        where: { OR: [{ id: subscription.gatewayId }, { name: subscription.gatewayId }] }
      }).catch(() => null)
    : null

  const hasToken = subscription.basisTheoryTokenId || subscription.nmiVaultId
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Back Link */}
        <a 
          href={`/orders/${id}`} 
          className="inline-flex items-center text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Order
        </a>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-500 to-teal-500">
            <h1 className="text-xl font-bold text-white">Charge Subscription</h1>
            <p className="text-emerald-100 text-sm mt-1">Process an immediate payment for this subscription</p>
          </div>

          {/* Amount Display */}
          <div className="p-6 border-b border-slate-100">
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-2">Amount to Charge</p>
              <p className="text-4xl font-bold text-slate-900">{fmt(subscription.price || 0)}</p>
              <p className="text-sm text-slate-500 mt-1">USD/month</p>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">{subscription.name}</h2>
                <p className="text-sm text-slate-500">Subscription #{subscription.id.slice(0, 8)}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-medium text-slate-500 mb-3">Customer</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                {subscription.customer?.firstName?.[0] || '?'}{subscription.customer?.lastName?.[0] || ''}
              </div>
              <div>
                <p className="font-medium text-slate-900">{subscription.customer?.firstName} {subscription.customer?.lastName}</p>
                <p className="text-sm text-slate-500">{subscription.customer?.email}</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-medium text-slate-500 mb-3">Payment Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Gateway</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                  {gateway?.displayName || gateway?.name || 'Default'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Card on File</span>
                {hasToken ? (
                  <span className="flex items-center text-emerald-600 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Saved
                  </span>
                ) : (
                  <span className="flex items-center text-red-500 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    No token
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Previous Bills</span>
                <span className="text-sm font-medium text-slate-900">{subscription.totalBills || 0}</span>
              </div>
            </div>
          </div>

          {/* Warning or Action */}
          {!hasToken ? (
            <div className="p-6 bg-red-50 border-t border-red-100">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-medium text-red-900">Cannot Charge</h3>
                  <p className="text-red-700 text-sm mt-1">No card token stored for this subscription.</p>
                </div>
              </div>
            </div>
          ) : subscription.status !== 'active' ? (
            <div className="p-6 bg-amber-50 border-t border-amber-100">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-medium text-amber-900">Subscription {subscription.status}</h3>
                  <p className="text-amber-700 text-sm mt-1">This subscription is not active and cannot be charged.</p>
                </div>
              </div>
            </div>
          ) : (
            <form action={`/api/subscriptions/${subscriptionId}/charge?from=order`} method="POST" className="p-6">
              <input type="hidden" name="orderId" value={id} />
              
              {/* Warning */}
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-amber-800 text-sm">
                    This will immediately charge <strong>{fmt(subscription.price || 0)}</strong> to the customer's card on file.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={`/orders/${id}`}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </a>
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Charge {fmt(subscription.price || 0)}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}