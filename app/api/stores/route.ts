import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

interface StoreResult {
  id: string
  name: string
  domain: string
  isActive: boolean
  lastSyncAt: Date | null
  productCount: number
  createdAt: Date
}

export async function GET() {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stores = await prisma.$queryRaw<StoreResult[]>`
      SELECT id, name, domain, "isActive", "lastSyncAt", "productCount", "createdAt"
      FROM "ShopifyStore"
      ORDER BY "createdAt" DESC
    `
    return NextResponse.json(stores)
  } catch (error) {
    console.error('Stores fetch error:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, domain, accessToken } = await request.json()

    if (!name || !domain || !accessToken) {
      return NextResponse.json(
        { error: 'Name, domain, and access token required' },
        { status: 400 }
      )
    }

    // Normalize domain
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')

    // Check if store already exists
    const existing = await prisma.$queryRaw<StoreResult[]>`
      SELECT id FROM "ShopifyStore" WHERE domain = ${normalizedDomain}
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Store already connected' },
        { status: 400 }
      )
    }

    // Create store using raw query
    const result = await prisma.$queryRaw<StoreResult[]>`
      INSERT INTO "ShopifyStore" (name, domain, "accessToken", "isActive", "productCount", "createdAt", "updatedAt")
      VALUES (${name}, ${normalizedDomain}, ${accessToken}, true, 0, NOW(), NOW())
      RETURNING id, name, domain, "isActive", "lastSyncAt", "productCount", "createdAt"
    `

    return NextResponse.json({ success: true, store: result[0] })
  } catch (error) {
    console.error('Store creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create store' },
      { status: 500 }
    )
  }
}