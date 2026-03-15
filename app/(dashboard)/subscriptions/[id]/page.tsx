import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  let subscription: any = null
  let transactions: any[] = []
  
  try {
    subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { customer: true }
    })
    
    if (!subscription) {
      notFound()
    }
    
    transactions = await prisma.transaction.findMany({
      where: { subscriptionId: id },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  } catch (e) {
    console.error(e)
    notFound()
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const date = (d: Date | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <a href="/subscriptions" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Subscriptions
        </a>

        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{subscription.name || 'Monthly Subscription'}</h1>
              <p className="text-gray-500 mt-1">#{subscription.id.slice(0, 8)}</p>
            </div>
            <div className="flex gap-2">
              {subscription.status === 'active' && (
                <>
                  <form action={`/api/subscriptions/${id}/pause`} method="POST">
                    <button className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors">
                      Pause
                    </button>
                  </form>
                  <form action={`/api/subscriptions/${id}/cancel`} method="POST">
                    <button className="px-4 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors">
                      Cancel
                    </button>
                  </form>
                </>
              )}
              {subscription.status === 'paused' && (
                <form action={`/api/subscriptions/${id}/resume`} method="POST">
                  <button className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors">
                    Resume
                  </button>
                </form>
              )}
              {subscription.status === 'cancelled' && (
                <span className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-500">
                  Cancelled
                </span>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Status */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
              <div className="mt-2">
                {subscription.status === 'active' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Active
                  </span>
                )}
                {subscription.status === 'paused' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Paused
                  </span>
                )}
                {subscription.status === 'cancelled' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Cancelled
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Price</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{fmt(subscription.price || 0)}</p>
              <p className="text-xs text-gray-500">per month</p>
            </div>

            {/* Next Bill */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next Bill</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{date(subscription.nextBillDate)}</p>
            </div>

            {/* Total Bills */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Bills</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{subscription.totalBills || 0}</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Customer Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-900">{subscription.customer?.firstName} {subscription.customer?.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{subscription.customer?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">3DS Protected</span>
                {subscription.threeDSCavv ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-2.332 9-7.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Yes
                  </span>
                ) : (
                  <span className="text-gray-400">No</span>
                )}
              </div>
            </div>
          </div>

          {/* Billing Settings Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m0 0L4 7m4-4v18M16 17v4m0 0l4-4m-4 4V3" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
            </div>

            {/* Billing Interval */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Billing Interval</label>
              <form action={`/api/subscriptions/${id}/billing-interval`} method="POST" className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">Every</span>
                <select name="interval" className="flex-1 min-w-[60px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n} selected={subscription.billingInterval === n}>{n}</option>
                  ))}
                </select>
                <select name="unit" className="flex-1 min-w-[100px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="day" selected={subscription.billingIntervalUnit === 'day'}>day(s)</option>
                  <option value="week" selected={subscription.billingIntervalUnit === 'week'}>week(s)</option>
                  <option value="month" selected={subscription.billingIntervalUnit === 'month'}>month(s)</option>
                  <option value="year" selected={subscription.billingIntervalUnit === 'year'}>year(s)</option>
                </select>
                <button type="submit" className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                  Update
                </button>
              </form>
            </div>

            {/* Next Bill Date */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Next Bill Date</label>
              <form action={`/api/subscriptions/${id}/next-bill-date`} method="POST" className="flex items-center gap-2">
                <input 
                  type="date" 
                  name="nextBillDate" 
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  defaultValue={subscription.nextBillDate ? new Date(subscription.nextBillDate).toISOString().split('T')[0] : ''}
                />
                <button type="submit" className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                  Update
                </button>
              </form>
            </div>

            {/* Last Billed */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Billed</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{date(subscription.lastBillDate)}</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            {transactions.length > 0 && (
              <span className="text-sm text-gray-500">{transactions.length} transactions</span>
            )}
          </div>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.status === 'approved' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      {tx.status === 'approved' ? (
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{fmt(tx.amount)}</p>
                      <p className="text-sm text-gray-500">{tx.description || tx.type}</p>
                      {tx.status === 'declined' && tx.declineReason && (
                        <p className="text-xs text-red-600 mt-0.5 font-medium">{tx.declineReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    {tx.cavv && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-2.332 9-7.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        3DS
                      </span>
                    )}
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{date(tx.createdAt)}</p>
                      {tx.status === 'approved' && (
                        <span className="text-xs text-emerald-600 font-medium">Approved</span>
                      )}
                      {tx.status === 'declined' && (
                        <span className="text-xs text-red-600 font-medium">Declined</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}