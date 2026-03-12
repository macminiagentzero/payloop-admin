import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { price } = body

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    // Update subscription directly in database
    const subscription = await prisma.subscription.update({
      where: { id },
      data: { price }
    })

    console.log('Updated subscription price:', subscription.id, 'to $' + price)

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}