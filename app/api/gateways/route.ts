import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { getCurrentBusinessId } from '@/lib/business'

// GET - List all gateways for current business
export async function GET() {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const businessId = await getCurrentBusinessId()
    
    if (!businessId) {
      // Fallback: return all gateways (for backward compatibility during migration)
      const gateways = await prisma.$queryRaw`
        SELECT id, name, "displayName", type, "isActive", "isDefault", "createdAt"
        FROM "PaymentGateway"
        ORDER BY "isDefault" DESC, "createdAt" ASC
      `
      return NextResponse.json(gateways)
    }

    const gateways = await prisma.$queryRaw`
      SELECT id, name, "displayName", type, "isActive", "isDefault", "createdAt"
      FROM "PaymentGateway"
      WHERE "businessId" = ${businessId}
      ORDER BY "isDefault" DESC, "createdAt" ASC
    `
    return NextResponse.json(gateways)
  } catch (error) {
    console.error('Error fetching gateways:', error)
    return NextResponse.json({ error: 'Failed to fetch gateways' }, { status: 500 })
  }
}

// POST - Create new gateway
export async function POST(request: NextRequest) {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const businessId = await getCurrentBusinessId()
    const body = await request.json()
    const { name, displayName, type, nmiSecurityKey, nmiEndpoint, nmiMerchantId, isActive, isDefault } = body

    // Validate required fields
    if (!name || !displayName || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, displayName, type' },
        { status: 400 }
      )
    }

    // For NMI, require security key
    if (type === 'nmi' && !nmiSecurityKey) {
      return NextResponse.json(
        { error: 'NMI gateways require nmiSecurityKey' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults first
    if (isDefault && businessId) {
      await prisma.$executeRaw`
        UPDATE "PaymentGateway"
        SET "isDefault" = false
        WHERE "businessId" = ${businessId} AND "isDefault" = true
      `
    } else if (isDefault) {
      await prisma.$executeRaw`
        UPDATE "PaymentGateway"
        SET "isDefault" = false
        WHERE "isDefault" = true
      `
    }

    // Insert the new gateway
    if (businessId) {
      await prisma.$executeRaw`
        INSERT INTO "PaymentGateway" (id, "businessId", name, "displayName", type, "nmiSecurityKey", "nmiEndpoint", "nmiMerchantId", "isActive", "isDefault", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${businessId}, ${name}, ${displayName}, ${type}, ${nmiSecurityKey || null}, ${nmiEndpoint || null}, ${nmiMerchantId || null}, ${isActive ?? true}, ${isDefault ?? false}, NOW(), NOW())
      `
    } else {
      // Backward compatibility: no business context
      await prisma.$executeRaw`
        INSERT INTO "PaymentGateway" (id, name, "displayName", type, "nmiSecurityKey", "nmiEndpoint", "nmiMerchantId", "isActive", "isDefault", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${name}, ${displayName}, ${type}, ${nmiSecurityKey || null}, ${nmiEndpoint || null}, ${nmiMerchantId || null}, ${isActive ?? true}, ${isDefault ?? false}, NOW(), NOW())
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating gateway:', error)
    return NextResponse.json(
      { error: 'Failed to create gateway' },
      { status: 500 }
    )
  }
}