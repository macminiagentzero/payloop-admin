import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { getCurrentBusinessId } from '@/lib/business'

export async function GET() {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const businessId = await getCurrentBusinessId()

    const where: any = {}
    if (businessId) {
      where.businessId = businessId
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { orders: true, subscriptions: true }
        }
      }
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Customers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}