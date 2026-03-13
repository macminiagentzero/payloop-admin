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
    <div className="space-y-6 p-6">
      {/* Back link */}
      <a href="/subscriptions" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Subscriptions
      </a>

      {/* Subscription Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{subscription.name || 'Monthly Subscription'}</h1>
            <p className="text-gray-500 mt-1">#{subscription.id.slice(0, 8)}</p>
          </div>
          <div className="flex gap-2">
            {subscription.status === 'active' && (
              <>
                <form action={`/api/subscriptions/${id}/pause`} method="POST">
                  <button className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">
                    Pause
                  </button>
                </form>
                <form action={`/api/subscriptions/${id}/cancel`} method="POST">
                  <button className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200">
                    Cancel
                  </button>
                </form>
              </>
            )}
            {subscription.status === 'paused' && (
              <form action={`/api/subscriptions/${id}/resume`} method="POST">
                <button className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200">
                  Resume
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <div className="mt-1">
              {subscription.status === 'active' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Active
                </span>
              )}
              {subscription.status === 'paused' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Paused
                </span>
              )}
              {subscription.status === 'cancelled' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Cancelled
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Price</p>
            <p className="text-xl font-semibold mt-1">{fmt(subscription.price || 0)}/mo</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Next Bill Date</p>
            <p className="text-lg mt-1">{date(subscription.nextBillDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Bills</p>
            <p className="text-xl font-semibold mt-1">{subscription.totalBills || 0}</p>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Customer</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{subscription.customer?.firstName} {subscription.customer?.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{subscription.customer?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">3DS Protected</p>
            {subscription.threeDSCavv ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Billing Settings */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Billing Settings</h2>
        
        {/* Billing Interval */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Billing Interval</p>
          <div className="flex items-center gap-3">
            <span className="text-gray-600">Every</span>
            <form action={`/api/subscriptions/${id}/billing-interval`} method="POST" className="flex items-center gap-2">
              <select name="interval" className="border rounded px-3 py-2 text-sm" defaultValue={subscription.billingInterval || 1}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <select name="unit" className="border rounded px-3 py-2 text-sm" defaultValue={subscription.billingIntervalUnit || 'month'}>
                <option value="day">day(s)</option>
                <option value="week">week(s)</option>
                <option value="month">month(s)</option>
                <option value="year">year(s)</option>
              </select>
              <button type="submit" className="text-sm px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Update
              </button>
            </form>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Current: Every {subscription.billingInterval || 1} {subscription.billingIntervalUnit || 'month'}{((subscription.billingInterval || 1) > 1 ? 's' : '')}
          </p>
        </div>

        {/* Next Bill Date */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Next Bill Date</p>
          <div className="flex items-center gap-3">
            <form action={`/api/subscriptions/${id}/next-bill-date`} method="POST" className="flex items-center gap-2">
              <input 
                type="date" 
                name="nextBillDate" 
                className="border rounded px-3 py-2 text-sm"
                defaultValue={subscription.nextBillDate ? new Date(subscription.nextBillDate).toISOString().split('T')[0] : ''}
              />
              <button type="submit" className="text-sm px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Update
              </button>
            </form>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Manually set when the next charge will occur
          </p>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-sm text-gray-500 mb-2">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            <form action={`/api/subscriptions/${id}/next-bill-date`} method="POST">
              <input type="hidden" name="nextBillDate" value={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} />
              <button type="submit" className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                Skip 7 days
              </button>
            </form>
            <form action={`/api/subscriptions/${id}/next-bill-date`} method="POST">
              <input type="hidden" name="nextBillDate" value={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} />
              <button type="submit" className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                Skip 30 days
              </button>
            </form>
            <form action={`/api/subscriptions/${id}/next-bill-date`} method="POST">
              <input type="hidden" name="nextBillDate" value={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} />
              <button type="submit" className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                Skip 3 months
              </button>
            </form>
          </div>
        </div>

        {/* Last Billed */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500">Last Billed</p>
          <p className="text-lg font-medium">{date(subscription.lastBillDate)}</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{fmt(tx.amount)}</p>
                  <p className="text-sm text-gray-500">{tx.description || tx.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{date(tx.createdAt)}</p>
                  <div className="flex items-center gap-2">
                    {tx.status === 'approved' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Approved</span>
                    )}
                    {tx.status === 'declined' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">Declined</span>
                    )}
                    {tx.cavv && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-2.332 9-7.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        3DS
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}