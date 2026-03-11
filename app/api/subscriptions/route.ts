import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Use raw SQL to avoid Prisma client errors when new schema columns don't exist yet
    // Only select columns that exist in the current database
    const subscriptions = await prisma.$queryRaw`
      SELECT 
        s.id, 
        s."customerId", 
        s.name, 
        s.status, 
        s."createdAt", 
        s."updatedAt"
      FROM "Subscription" s
      ORDER BY s."createdAt" DESC
    ` as any[]
    
    // Get customer data for each subscription
    const customerIds = [...new Set(subscriptions.map(s => s.customerId))]
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } }
    })
    const customerMap = new Map(customers.map(c => [c.id, c]))
    
    // Combine the data
    const result = subscriptions.map(s => ({
      id: s.id,
      customerId: s.customerId,
      name: s.name,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      customer: customerMap.get(s.customerId) || null
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Subscriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}