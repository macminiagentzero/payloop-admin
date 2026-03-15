import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// Migration endpoint for subscription billing fields
export async function POST(request: Request) {
  // Check authentication
  const auth = await isAuthenticated()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = []

  try {
    // Step 1: Add billingMode field
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "billingMode" TEXT DEFAULT 'automatic'
      `)
      results.push('✓ billingMode field added')
    } catch (e: any) {
      results.push(`! billingMode: ${e.message}`)
    }

    // Step 2: Add retry tracking fields
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "retryCount" INTEGER DEFAULT 0
      `)
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "maxRetries" INTEGER DEFAULT 3
      `)
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "lastRetryAt" TIMESTAMP
      `)
      results.push('✓ Retry tracking fields added')
    } catch (e: any) {
      results.push(`! Retry fields: ${e.message}`)
    }

    // Step 3: Add cancelReason field
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT
      `)
      results.push('✓ cancelReason field added')
    } catch (e: any) {
      results.push(`! cancelReason: ${e.message}`)
    }

    // Step 4: Update status enum values
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE "Subscription" SET status = 'active' WHERE status = 'pending'
      `)
      results.push('✓ Subscription status updated')
    } catch (e: any) {
      results.push(`! Status update: ${e.message}`)
    }

    // Step 5: Set nextBillDate for active subscriptions that don't have one
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE "Subscription" 
        SET "nextBillDate" = DATE_ADD(NOW(), INTERVAL "billingInterval" MONTH)
        WHERE "nextBillDate" IS NULL AND status = 'active'
      `)
      results.push('✓ nextBillDate set for active subscriptions')
    } catch (e: any) {
      results.push(`! nextBillDate: ${e.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription billing migration complete',
      results
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      results
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Subscription billing migration endpoint',
    fields: [
      'billingMode',
      'retryCount',
      'maxRetries', 
      'lastRetryAt',
      'cancelReason'
    ],
    status: 'POST to run migration'
  })
}