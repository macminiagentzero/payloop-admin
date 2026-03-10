import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Update gateway assignment (form POST)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const formData = await request.formData()
    const gatewayId = formData.get('gatewayId') as string | null
    
    const product = await prisma.subscriptionProduct.update({
      where: { id },
      data: {
        gatewayId: gatewayId || null,
        updatedAt: new Date()
      }
    })
    
    // Redirect back to the page
    return NextResponse.redirect(new URL('/subscription-products?saved=' + id, request.url))
  } catch (error) {
    console.error('Update gateway error:', error)
    return NextResponse.json({ error: 'Failed to update gateway' }, { status: 500 })
  }
}

// Also support PATCH for API calls
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const data = await request.json()
    
    const product = await prisma.subscriptionProduct.update({
      where: { id },
      data: {
        gatewayId: data.gatewayId || null,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Update gateway error:', error)
    return NextResponse.json({ error: 'Failed to update gateway' }, { status: 500 })
  }
}