import { prisma } from '@/lib/prisma'
import SubscriptionsTable from '@/components/SubscriptionsTable'

export default async function SubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
        <p className="text-slate-500 mt-1">Manage recurring subscriptions</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <SubscriptionsTable subscriptions={subscriptions} />
      </div>
    </div>
  )
}