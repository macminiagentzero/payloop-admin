import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7days'
    
    // Calculate date range
    const now = new Date()
    let startDate: Date
    let endDate: Date = now
    
    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
        break
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        break
      case 'all':
      default:
        startDate = new Date(2020, 0, 1) // Far enough back
        break
    }
    
    // Fetch stats for the date range
    const [
      totalRevenue,
      totalOrders,
      approvedOrders,
      declinedOrders,
      totalCustomers,
      activeSubscriptions,
      recentOrders,
      chartData
    ] = await Promise.all([
      // Total revenue in range
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'approved'
        }
      }),
      
      // Total orders in range
      prisma.order.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      
      // Approved orders in range
      prisma.order.count({
        where: { createdAt: { gte: startDate, lte: endDate }, status: 'approved' }
      }),
      
      // Declined orders in range
      prisma.order.count({
        where: { createdAt: { gte: startDate, lte: endDate }, status: 'declined' }
      }),
      
      // Total customers (all time)
      prisma.customer.count(),
      
      // Active subscriptions (all time)
      prisma.subscription.count({ where: { status: 'active' } }),
      
      // Recent orders (last 10)
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      
      // Chart data - group by day
      prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'approved'
        },
        select: {
          total: true,
          createdAt: true
        }
      })
    ])
    
    // Process chart data - group by date
    const chartByDate: Record<string, number> = {}
    chartData.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0]
      chartByDate[date] = (chartByDate[date] || 0) + (order.total || 0)
    })
    
    // Fill in missing dates
    const chartDates: { date: string; total: number }[] = []
    const current = new Date(startDate)
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0]
      chartDates.push({
        date: dateStr,
        total: chartByDate[dateStr] || 0
      })
      current.setDate(current.getDate() + 1)
    }
    
    return NextResponse.json({
      stats: {
        totalRevenue: totalRevenue._sum.total || 0,
        totalOrders,
        approvedOrders,
        declinedOrders,
        totalCustomers,
        activeSubscriptions,
        approvalRate: totalOrders > 0 ? Math.round((approvedOrders / totalOrders) * 100) : 0,
        declineRate: totalOrders > 0 ? Math.round((declinedOrders / totalOrders) * 100) : 0,
        avgOrderValue: totalOrders > 0 ? (totalRevenue._sum.total || 0) / totalOrders : 0
      },
      recentOrders,
      chartData: chartDates
    })
    
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}