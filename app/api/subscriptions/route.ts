import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Use $queryRaw to avoid Prisma client errors when schema columns don't exist yet
    // This is a temporary solution until the database schema is migrated
    const subscriptions = await prisma.$queryRaw`
      SELECT 
        s.id, 
        s."customerId", 
        s.name, 
        s.status, 
        s."createdAt", 
        s."updatedAt",
        c.id as "customer_id",
        c.email as "customer_email",
        c."firstName" as "customer_firstName",
        c."lastName" as "customer_lastName",
        c.phone as "customer_phone",
        c.address as "customer_address",
        c.city as "customer_city",
        c.state as "customer_state",
        c.zip as "customer_zip",
        c.country as "customer_country"
      FROM "Subscription" s
      LEFT JOIN "Customer" c ON s."customerId" = c.id
      ORDER BY s."createdAt" DESC
    ` as any[]
    
    // Transform the results to match the expected format
    const formatted = subscriptions.map(s => ({
      id: s.id,
      customerId: s.customerId,
      name: s.name,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      customer: {
        id: s.customer_id,
        email: s.customer_email,
        firstName: s.customer_firstName,
        lastName: s.customer_lastName,
        phone: s.customer_phone,
        address: s.customer_address,
        city: s.customer_city,
        state: s.customer_state,
        zip: s.customer_zip,
        country: s.customer_country,
      }
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Subscriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}