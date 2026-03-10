import { prisma } from '@/lib/prisma'
import StatsCards from '@/components/StatsCards'
import RecentOrders from '@/components/RecentOrders'

export default async function DashboardPage() {
  // Fetch stats
  const [totalRevenue, totalOrders, approvedOrders, declinedOrders, totalCustomers, activeSubscriptions] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'approved' } }),
    prisma.order.count({ where: { status: 'declined' } }),
    prisma.customer.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
  ])

  // Fetch recent orders
  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { customer: true },
  })

  const stats = {
    totalRevenue: totalRevenue._sum.total || 0,
    totalOrders,
    approvedOrders,
    declinedOrders,
    totalCustomers,
    activeSubscriptions,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here's your PayLoop overview.</p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
        </div>
        <RecentOrders orders={recentOrders} />
      </div>
    </div>
  )
}