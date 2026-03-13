import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// This endpoint initializes the database tables
// Call it once after deployment: GET /api/init-db

export async function GET() {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Create ShopifyStore table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ShopifyStore" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE NOT NULL,
        "accessToken" VARCHAR(255) NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "lastSyncAt" TIMESTAMP,
        "productCount" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `

    // Create ShopifyProduct table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ShopifyProduct" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "storeId" UUID NOT NULL REFERENCES "ShopifyStore"(id) ON DELETE CASCADE,
        "shopifyId" VARCHAR(255) NOT NULL,
        title VARCHAR(500) NOT NULL,
        handle VARCHAR(255),
        "productType" VARCHAR(255),
        vendor VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        image TEXT,
        price DECIMAL(10, 2),
        "compareAtPrice" DECIMAL(10, 2),
        variants TEXT,
        "syncedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("storeId", "shopifyId")
      )
    `

    // Create PaymentGateway table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "PaymentGateway" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        "displayName" VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        "apiKey" TEXT NOT NULL,
        "apiSecret" TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "isDefault" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_shopify_product_store ON "ShopifyProduct"("storeId")
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_shopify_store_domain ON "ShopifyStore"(domain)
    `

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_payment_gateway_type ON "PaymentGateway"(type)
    `

    // Create Transaction table
    const transactionTableCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Transaction'
      ) as exists
    `
    
    if (!transactionTableCheck[0]?.exists) {
      console.log('Creating Transaction table...')
      await prisma.$executeRaw`
        CREATE TABLE "Transaction" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "subscriptionId" UUID NOT NULL REFERENCES "Subscription"(id) ON DELETE CASCADE,
          "orderId" UUID REFERENCES "Order"(id) ON DELETE SET NULL,
          amount DECIMAL(10, 2) NOT NULL,
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
      console.log('Transaction table created')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database tables created successfully',
      tables: ['ShopifyStore', 'ShopifyProduct', 'PaymentGateway', 'Transaction']
    })
  } catch (error) {
    console.error('Init DB error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}