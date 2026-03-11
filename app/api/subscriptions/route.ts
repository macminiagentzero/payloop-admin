import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        customer: true,
      },
    })

    // Fetch gateway info for subscriptions that have a gatewayId
    const gatewayIds = subscriptions
      .map(s => s.gatewayId)
      .filter((id): id is string => id !== null)
    
    const gateways = await prisma.paymentGateway.findMany({
      where: { id: { in: gatewayIds } },
      select: { id: true, name: true, displayName: true }
    })
    
    const gatewayMap = new Map(gateways.map(g => [g.id, g]))
    
    // Add gateway info to each subscription
    const subscriptionsWithGateway = subscriptions.map(sub => ({
      ...sub,
      gateway: sub.gatewayId ? gatewayMap.get(sub.gatewayId) || null : null
    }))

    return NextResponse.json(subscriptionsWithGateway)
  } catch (error) {
    console.error('Subscriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}