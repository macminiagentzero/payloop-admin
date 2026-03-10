import { prisma } from '@/lib/prisma'
import CustomersTable from '@/components/CustomersTable'

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { orders: true, subscriptions: true }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <p className="text-slate-500 mt-1">View and manage your customers</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <CustomersTable customers={customers} />
      </div>
    </div>
  )
}