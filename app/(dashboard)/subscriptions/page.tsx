import { prisma } from '@/lib/prisma'
import SubscriptionsTableClient from '@/components/SubscriptionsTableClient'

export default async function SubscriptionsPage() {
  const [subscriptions, gateways] = await Promise.all([
    prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    }),
    prisma.paymentGateway.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
        <p className="text-slate-500 mt-1">Manage recurring subscriptions</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <SubscriptionsTableClient subscriptions={subscriptions} gateways={gateways} />
      </div>
    </div>
  )
}