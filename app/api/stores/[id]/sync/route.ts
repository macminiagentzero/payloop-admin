import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

interface Props {
  params: Promise<{ id: string }>
}

// Shopify API helper
async function shopifyRequest(domain: string, accessToken: string, endpoint: string) {
  const url = `https://${domain}/admin/api/2024-01/${endpoint}`
  
  console.log('Shopify API request:', url)
  
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('Shopify API error:', response.status, text)
    throw new Error(`Shopify API error: ${response.status}`)
  }

  return response.json()
}

interface StoreResult {
  id: string
  domain: string
  accessToken: string
}

export async function POST(request: NextRequest, { params }: Props) {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Get store from database - cast UUID properly
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const stores = await prisma.$queryRaw<StoreResult[]>`
      SELECT id, domain, "accessToken"
      FROM "ShopifyStore"
      WHERE id = ${id}::uuid
    `

    if (stores.length === 0) {
      await prisma.$disconnect()
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const store = stores[0]
    console.log('Store found:', store.domain)
    await prisma.$disconnect()

    // Fetch products from Shopify - correct parameter order: domain, accessToken, endpoint
    const data = await shopifyRequest(store.domain, store.accessToken, 'products.json?limit=250')
    
    const products = data.products || []
    console.log('Products fetched:', products.length)
    
    // Import prisma again for updates
    const { PrismaClient: PrismaClient2 } = await import('@prisma/client')
    const prisma2 = new PrismaClient2()

    // Upsert each product - cast UUID properly
    for (const product of products) {
      const image = product.images?.[0]?.src || null
      const variant = product.variants?.[0]
      const price = variant?.price ? parseFloat(variant.price) : null

      await prisma2.$executeRaw`
        INSERT INTO "ShopifyProduct" (id, "storeId", "shopifyId", title, handle, status, image, price, "syncedAt", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${id}::uuid, ${String(product.id)}, ${product.title}, ${product.handle}, ${product.status}, ${image}, ${price}, NOW(), NOW(), NOW())
        ON CONFLICT ("storeId", "shopifyId") 
        DO UPDATE SET 
          title = ${product.title}, 
          status = ${product.status}, 
          image = ${image}, 
          price = ${price}, 
          "syncedAt" = NOW(), 
          "updatedAt" = NOW()
      `
    }

    // Update store with sync time and product count - cast UUID properly
    await prisma2.$executeRaw`
      UPDATE "ShopifyStore"
      SET "lastSyncAt" = NOW(), "productCount" = ${products.length}, "updatedAt" = NOW()
      WHERE id = ${id}::uuid
    `

    await prisma2.$disconnect()

    return NextResponse.json({ success: true, count: products.length })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}