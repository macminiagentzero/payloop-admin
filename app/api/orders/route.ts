import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { getCurrentBusinessId } from '@/lib/business'

function getDateRange(range: string): { startDate: Date; endDate: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (range) {
    case 'today':
      return { startDate: today, endDate: now }
    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { startDate: yesterday, endDate: today }
    }
    case '7days': {
      const startDate = new Date(today)
      startDate.setDate(startDate.getDate() - 7)
      return { startDate, endDate: now }
    }
    case '30days': {
      const startDate = new Date(today)
      startDate.setDate(startDate.getDate() - 30)
      return { startDate, endDate: now }
    }
    case 'thisMonth': {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      return { startDate, endDate: now }
    }
    case 'lastMonth': {
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endDate = new Date(now.getFullYear(), now.getMonth(), 1)
      return { startDate, endDate }
    }
    case 'all':
    default:
      return { startDate: new Date('2020-01-01'), endDate: now }
  }
}

export async function GET(request: NextRequest) {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const businessId = await getCurrentBusinessId()
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7days'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    
    let startDate: Date
    let endDate: Date
    
    // Support custom date range
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      // Set start to beginning of day
      startDate.setHours(0, 0, 0, 0)
      
      endDate = new Date(endDateParam)
      // Set end to end of day
      endDate.setHours(23, 59, 59, 999)
    } else {
      const rangeDates = getDateRange(range)
      startDate = rangeDates.startDate
      endDate = rangeDates.endDate
    }

    // Build where clause
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }
    
    // Add business filter if available
    if (businessId) {
      where.businessId = businessId
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { 
        customer: true,
        subscriptions: {
          select: {
            id: true,
            threeDSCavv: true,
            threeDSXid: true,
            threeDSEci: true,
            threeDSAuthDate: true,
            status: true,
            totalBills: true
          }
        }
      },
    })

    // Add has3DS flag to each order
    const ordersWith3DS = orders.map(order => ({
      ...order,
      has3DS: order.subscriptions?.some((s: any) => s.threeDSCavv) || false
    }))

    return NextResponse.json(ordersWith3DS)
  } catch (error) {
    console.error('Orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}