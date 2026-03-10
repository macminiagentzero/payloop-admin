import { NextRequest, NextResponse } from 'next/server'

interface Props {
  params: Promise<{ id: string }>
}

// Shopify API helper
async function shopifyRequest(domain: string, accessToken: string, endpoint: string) {
  const url = `https://${domain}/admin/api/2024-01/${endpoint}`
  
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`)
  }

  return response.json()
}

export async function POST(request: NextRequest, { params }: Props) {
  const { id } = await params

  try {
    // Get store from database
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const stores = await prisma.$queryRaw`
      SELECT id, domain, "accessToken"
      FROM "ShopifyStore"
      WHERE id = ${id}
    ` as any[]

    if (stores.length === 0) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const store = stores[0]
    await prisma.$disconnect()

    // Fetch products from Shopify
    const data = await shopifyRequest(store.domain, store.accessToken, 'products.json?limit=250')
    
    const products = data.products || []
    
    // Import prisma again for updates
    const { PrismaClient: PrismaClient2 } = await import('@prisma/client')
    const prisma2 = new PrismaClient2()

    // Upsert each product
    for (const product of products) {
      const image = product.images?.[0]?.src || null
      const variant = product.variants?.[0]
      const price = variant?.price ? parseFloat(variant.price) : null

      await prisma2.$executeRaw`
        INSERT INTO "ShopifyProduct" (id, "storeId", "shopifyId", title, handle, status, image, price, "syncedAt", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${id}, ${String(product.id)}, ${product.title}, ${product.handle}, ${product.status}, ${image}, ${price}, NOW(), NOW(), NOW())
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

    // Update store with sync time and product count
    await prisma2.$executeRaw`
      UPDATE "ShopifyStore"
      SET "lastSyncAt" = NOW(), "productCount" = ${products.length}, "updatedAt" = NOW()
      WHERE id = ${id}
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