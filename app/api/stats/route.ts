import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      totalRevenue,
      totalOrders,
      approvedOrders,
      declinedOrders,
      totalCustomers,
      activeSubscriptions,
    ] = await Promise.all([
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'approved' } }),
      prisma.order.count({ where: { status: 'declined' } }),
      prisma.customer.count(),
      prisma.subscription.count({ where: { status: 'active' } }),
    ])

    return NextResponse.json({
      totalRevenue: totalRevenue._sum.total || 0,
      totalOrders,
      approvedOrders,
      declinedOrders,
      totalCustomers,
      activeSubscriptions,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}