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
      
      // Create the table with UUID support
      await prisma.$executeRaw`
        CREATE TABLE "Transaction" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "subscriptionId" UUID NOT NULL REFERENCES "Subscription"(id) ON DELETE CASCADE,
          "orderId" UUID REFERENCES "Order"(id) ON DELETE SET NULL,
          amount DOUBLE PRECISION NOT NULL,
          currency VARCHAR(10) DEFAULT 'USD',
          "gatewayId" UUID,
          "transactionId" VARCHAR(255),
          "authCode" VARCHAR(255),
          status VARCHAR(50) DEFAULT 'pending',
          type VARCHAR(50) DEFAULT 'rebill',
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