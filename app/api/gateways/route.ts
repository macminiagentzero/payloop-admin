import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - List all gateways
export async function GET() {
  try {
    const gateways = await prisma.$queryRaw`
      SELECT id, name, "displayName", type, "isActive", "isDefault", "createdAt"
      FROM "PaymentGateway"
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
  try {
    const body = await request.json()
    const { name, displayName, type, apiKey, apiSecret, isActive, isDefault } = body

    // Validate required fields
    if (!name || !displayName || !type || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults first
    if (isDefault) {
      await prisma.$executeRaw`
        UPDATE "PaymentGateway"
        SET "isDefault" = false
        WHERE "isDefault" = true
      `
    }

    // Insert the new gateway
    await prisma.$executeRaw`
      INSERT INTO "PaymentGateway" (id, name, "displayName", type, "apiKey", "apiSecret", "isActive", "isDefault", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${name}, ${displayName}, ${type}, ${apiKey}, ${apiSecret || ''}, ${isActive}, ${isDefault}, NOW(), NOW())
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating gateway:', error)
    return NextResponse.json(
      { error: 'Failed to create gateway' },
      { status: 500 }
    )
  }
}