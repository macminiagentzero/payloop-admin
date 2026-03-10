import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('Fetching gateway with id:', id)
    
    const gateway = await prisma.$queryRaw<any[]>`
      SELECT id, name, "displayName", type, "nmiEndpoint", "nmiMerchantId", "isActive", "isDefault", "createdAt"
      FROM "PaymentGateway"
      WHERE id = ${id}
      LIMIT 1
    `
    
    console.log('Gateway query result:', gateway)
    
    if (!gateway || gateway.length === 0) {
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 })
    }
    
    return NextResponse.json(gateway[0])
  } catch (error) {
    console.error('Get gateway error:', error)
    return NextResponse.json({ error: 'Failed to get gateway', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const data = await request.json()
    
    // Build dynamic update query
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1
    
    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(data.name)
    }
    if (data.displayName !== undefined) {
      updates.push(`"displayName" = $${paramIndex++}`)
      values.push(data.displayName)
    }
    if (data.type !== undefined) {
      updates.push(`type = $${paramIndex++}`)
      values.push(data.type)
    }
    if (data.endpoint !== undefined) {
      updates.push(`"nmiEndpoint" = $${paramIndex++}`)
      values.push(data.endpoint)
    }
    if (data.securityKey !== undefined && data.securityKey !== '') {
      updates.push(`"nmiSecurityKey" = $${paramIndex++}`)
      values.push(data.securityKey)
    }
    if (data.merchantId !== undefined) {
      updates.push(`"nmiMerchantId" = $${paramIndex++}`)
      values.push(data.merchantId)
    }
    if (data.isActive !== undefined) {
      updates.push(`"isActive" = $${paramIndex++}`)
      values.push(data.isActive)
    }
    if (data.isDefault !== undefined) {
      // If setting as default, unset others first
      if (data.isDefault) {
        await prisma.$executeRaw`UPDATE "PaymentGateway" SET "isDefault" = false`
      }
      updates.push(`"isDefault" = $${paramIndex++}`)
      values.push(data.isDefault)
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
    
    values.push(id)
    
    const query = `
      UPDATE "PaymentGateway"
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, "displayName", type, "nmiMerchantId", "isActive", "isDefault"
    `
    
    const result = await prisma.$queryRawUnsafe<any[]>(query, ...values)
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Update gateway error:', error)
    return NextResponse.json({ error: 'Failed to update gateway' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await prisma.$executeRaw`
      DELETE FROM "PaymentGateway"
      WHERE id = ${id}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete gateway error:', error)
    return NextResponse.json({ error: 'Failed to delete gateway' }, { status: 500 })
  }
}