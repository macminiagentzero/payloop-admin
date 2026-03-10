import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Update gateway assignment for a subscription product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const data = await request.json()
    
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    }
    
    if (data.gatewayId !== undefined) {
      updateData.gatewayId = data.gatewayId || null
    }
    if (data.name !== undefined) {
      updateData.name = data.name
    }
    if (data.description !== undefined) {
      updateData.description = data.description
    }
    if (data.price !== undefined) {
      updateData.price = parseFloat(data.price)
    }
    if (data.interval !== undefined) {
      updateData.interval = data.interval
    }
    if (data.intervalCount !== undefined) {
      updateData.intervalCount = parseInt(data.intervalCount)
    }
    if (data.showOnCheckout !== undefined) {
      updateData.showOnCheckout = data.showOnCheckout
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive
    }
    
    const product = await prisma.subscriptionProduct.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Update subscription product error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// Get a single subscription product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const product = await prisma.subscriptionProduct.findUnique({
      where: { id }
    })
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    return NextResponse.json({ product })
  } catch (error) {
    console.error('Get subscription product error:', error)
    return NextResponse.json({ error: 'Failed to get product' }, { status: 500 })
  }
}

// Delete a subscription product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    await prisma.subscriptionProduct.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete subscription product error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}