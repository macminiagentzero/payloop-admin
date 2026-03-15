import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// POST /api/subscriptions/:id/cancel
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await isAuthenticated()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { reason } = body

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { business: true, customer: true }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Subscription is already cancelled' 
      }, { status: 400 })
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: reason || 'Cancelled by admin',
        nextBillDate: null
      }
    })

    return NextResponse.json({
      success: true,
      subscription: updated,
      message: `Subscription cancelled. Customer: ${subscription.customer?.email}`
    })

  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json({ 
      error: 'Failed to cancel subscription' 
    }, { status: 500 })
  }
}