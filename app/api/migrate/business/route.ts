import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function POST() {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Starting multi-business migration...')
    const results: string[] = []

    // Step 1: Create Business table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Business" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          name TEXT NOT NULL,
          slug TEXT UNIQUE,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `)
      results.push('✓ Business table created')
    } catch (e: any) {
      if (e.code !== '42P07') results.push(`✗ Business table: ${e.message}`)
      else results.push('✓ Business table already exists')
    }

    // Step 2: Create UserBusiness table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "UserBusiness" (
          "userId" TEXT NOT NULL,
          "businessId" TEXT NOT NULL,
          role TEXT DEFAULT 'admin',
          "createdAt" TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY ("userId", "businessId")
        )
      `)
      results.push('✓ UserBusiness table created')
    } catch (e: any) {
      if (e.code !== '42P07') results.push(`✗ UserBusiness table: ${e.message}`)
      else results.push('✓ UserBusiness table already exists')
    }

    // Step 3: Create BusinessSetting table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BusinessSetting" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "businessId" TEXT NOT NULL,
          key TEXT NOT NULL,
          value TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          CONSTRAINT "BusinessSetting_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"(id) ON DELETE CASCADE,
          CONSTRAINT "BusinessSetting_businessId_key_unique" UNIQUE ("businessId", key)
        )
      `)
      results.push('✓ BusinessSetting table created')
    } catch (e: any) {
      if (e.code !== '42P07') results.push(`✗ BusinessSetting table: ${e.message}`)
      else results.push('✓ BusinessSetting table already exists')
    }

    // Step 4: Add businessId columns to existing tables
    const tablesWithBusiness = [
      'Customer', 'Order', 'Subscription', 'Transaction', 
      'PaymentGateway', 'SubscriptionProduct', 'Funnel', 'SyncedProduct', 'ShopifyCart'
    ]

    for (const table of tablesWithBusiness) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "businessId" TEXT
        `)
        results.push(`✓ ${table}.businessId added`)
      } catch (e: any) {
        if (e.code !== '42701') results.push(`✗ ${table}.businessId: ${e.message}`)
        else results.push(`✓ ${table}.businessId already exists`)
      }
    }

    // Step 5: Create indexes on businessId
    for (const table of tablesWithBusiness) {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "${table}_businessId_idx" ON "${table}"("businessId")
        `)
        results.push(`✓ ${table}_businessId_idx created`)
      } catch (e: any) {
        results.push(`✗ ${table}_businessId_idx: ${e.message}`)
      }
    }

    // Step 6: Create default business if not exists
    let defaultBusiness = await prisma.$queryRawUnsafe<{id: string}[]>(`
      SELECT id FROM "Business" WHERE slug = 'default' LIMIT 1
    `)

    let defaultBusinessId: string

    if (defaultBusiness.length === 0) {
      const created = await prisma.$queryRawUnsafe<{id: string}[]>(`
        INSERT INTO "Business" (name, slug, "isActive") 
        VALUES ('Default Business', 'default', true) 
        RETURNING id
      `)
      defaultBusinessId = created[0].id
      results.push('✓ Default business created: ' + defaultBusinessId)
    } else {
      defaultBusinessId = defaultBusiness[0].id
      results.push('✓ Default business exists: ' + defaultBusinessId)
    }

    // Step 7: Assign existing data to default business
    for (const table of tablesWithBusiness) {
      try {
        const updateResult = await prisma.$executeRawUnsafe(`
          UPDATE "${table}" SET "businessId" = '${defaultBusinessId}' WHERE "businessId" IS NULL
        `)
        results.push(`✓ ${table}: ${updateResult} rows assigned to default business`)
      } catch (e: any) {
        results.push(`✗ ${table} assignment: ${e.message}`)
      }
    }

    // Step 8: Update Customer unique constraint to be business-scoped
    try {
      // Drop old unique constraint on email
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_email_key"
      `)
      // Add new unique constraint on (businessId, email)
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_email_unique" UNIQUE ("businessId", email)
      `)
      results.push('✓ Customer email unique constraint updated to business-scoped')
    } catch (e: any) {
      if (e.code === '42P16' || e.code === '42P07') {
        results.push('✓ Customer unique constraint already exists or not needed')
      } else {
        results.push(`! Customer constraint: ${e.message}`)
      }
    }

    // Step 9: Update PaymentGateway unique constraint
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "PaymentGateway" DROP CONSTRAINT IF EXISTS "PaymentGateway_name_key"
      `)
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "PaymentGateway" ADD CONSTRAINT "PaymentGateway_businessId_name_unique" UNIQUE ("businessId", name)
      `)
      results.push('✓ PaymentGateway name unique constraint updated to business-scoped')
    } catch (e: any) {
      results.push(`! PaymentGateway constraint: ${e.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Multi-business migration complete',
      defaultBusinessId,
      results
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error.message
    }, { status: 500 })
  }
}