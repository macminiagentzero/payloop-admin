import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// Debug endpoint to check Transaction table and create if needed
export async function GET() {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if Transaction table exists
    const tableCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Transaction'
      ) as exists
    `
    
    const tableExists = tableCheck[0]?.exists
    
    if (!tableExists) {
      console.log('Transaction table does not exist, creating...')
      
      // Create the table with TEXT ids (matching Prisma String type)
      await prisma.$executeRaw`
        CREATE TABLE "Transaction" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "subscriptionId" TEXT NOT NULL REFERENCES "Subscription"(id) ON DELETE CASCADE,
          "orderId" TEXT REFERENCES "Order"(id) ON DELETE SET NULL,
          amount DOUBLE PRECISION NOT NULL,
          currency TEXT DEFAULT 'USD',
          "gatewayId" TEXT,
          "transactionId" TEXT,
          "authCode" TEXT,
          status TEXT DEFAULT 'pending',
          type TEXT DEFAULT 'rebill',
          description TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW()
        )
      `
      
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Transaction_subscriptionId_idx" ON "Transaction"("subscriptionId")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Transaction_orderId_idx" ON "Transaction"("orderId")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt")`
      
      return NextResponse.json({ 
        success: true, 
        message: 'Transaction table created',
        tableExists: false,
        nowExists: true
      })
    }
    
    // Count existing transactions
    const count = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM "Transaction"
    `
    
    return NextResponse.json({ 
      success: true, 
      tableExists: true,
      transactionCount: Number(count[0]?.count || 0)
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Failed to check/create Transaction table', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Force recreate Transaction table (fixes schema mismatch)
export async function DELETE() {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Dropping and recreating Transaction table...')
    
    // Drop the table if it exists
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Transaction" CASCADE`
    
    // Recreate with correct schema (TEXT instead of UUID)
    await prisma.$executeRaw`
      CREATE TABLE "Transaction" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "subscriptionId" TEXT NOT NULL REFERENCES "Subscription"(id) ON DELETE CASCADE,
        "orderId" TEXT REFERENCES "Order"(id) ON DELETE SET NULL,
        amount DOUBLE PRECISION NOT NULL,
        currency TEXT DEFAULT 'USD',
        "gatewayId" TEXT,
        "transactionId" TEXT,
        "authCode" TEXT,
        status TEXT DEFAULT 'pending',
        type TEXT DEFAULT 'rebill',
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `
    await prisma.$executeRaw`CREATE INDEX "Transaction_subscriptionId_idx" ON "Transaction"("subscriptionId")`
    await prisma.$executeRaw`CREATE INDEX "Transaction_orderId_idx" ON "Transaction"("orderId")`
    await prisma.$executeRaw`CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt")`
    
    return NextResponse.json({ success: true, message: 'Transaction table recreated with correct schema (TEXT ids)' })
  } catch (error) {
    console.error('Error recreating Transaction table:', error)
    return NextResponse.json({ 
      error: 'Failed to recreate Transaction table', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}