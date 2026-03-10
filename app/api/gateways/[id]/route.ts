import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('Fetching gateway with id:', id)
    
    const gateway = await prisma.paymentGateway.findUnique({
      where: { id }
    })
    
    console.log('Gateway query result:', gateway)
    
    if (!gateway) {
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 })
    }
    
    // Mask the security key
    const maskedGateway = {
      ...gateway,
      nmiSecurityKey: gateway.nmiSecurityKey ? '••••••••' + gateway.nmiSecurityKey.slice(-4) : null
    }
    
    return NextResponse.json(maskedGateway)
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
    
    const updateData: Record<string, unknown> = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.displayName !== undefined) updateData.displayName = data.displayName
    if (data.type !== undefined) updateData.type = data.type
    if (data.endpoint !== undefined) updateData.nmiEndpoint = data.endpoint
    if (data.securityKey !== undefined && data.securityKey !== '') updateData.nmiSecurityKey = data.securityKey
    if (data.merchantId !== undefined) updateData.nmiMerchantId = data.merchantId
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.isDefault !== undefined) {
      // If setting as default, unset others first
      if (data.isDefault) {
        await prisma.paymentGateway.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        })
      }
      updateData.isDefault = data.isDefault
    }
    
    const gateway = await prisma.paymentGateway.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json(gateway)
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
    await prisma.paymentGateway.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete gateway error:', error)
    return NextResponse.json({ error: 'Failed to delete gateway' }, { status: 500 })
  }
}