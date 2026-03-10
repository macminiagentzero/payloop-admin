import { prisma } from '@/lib/prisma'
import OrdersTable from '@/components/OrdersTable'

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-slate-500 mt-1">Manage all orders and transactions</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <OrdersTable orders={orders} />
      </div>
    </div>
  )
}