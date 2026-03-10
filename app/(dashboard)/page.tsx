import { prisma } from '@/lib/prisma'
import StatsCards from '@/components/StatsCards'
import RecentOrders from '@/components/RecentOrders'
import RevenueChart from '@/components/RevenueChart'

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

  // Get last 7 days revenue
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const recentRevenue = await prisma.order.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
      status: 'approved'
    },
    select: {
      total: true,
      createdAt: true
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's your PayLoop overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={recentRevenue} />
        
        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Approval Rate</span>
              <span className="font-semibold text-green-600">
                {totalOrders > 0 ? Math.round((approvedOrders / totalOrders) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Decline Rate</span>
              <span className="font-semibold text-red-600">
                {totalOrders > 0 ? Math.round((declinedOrders / totalOrders) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Avg Order Value</span>
              <span className="font-semibold text-slate-900">
                {totalOrders > 0 ? `$${((stats.totalRevenue || 0) / totalOrders).toFixed(2)}` : '$0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Subscription Rate</span>
              <span className="font-semibold text-purple-600">
                {totalCustomers > 0 ? Math.round((activeSubscriptions / totalCustomers) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          <a href="/orders" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all →
          </a>
        </div>
        <RecentOrders orders={recentOrders} />
      </div>
    </div>
  )
}