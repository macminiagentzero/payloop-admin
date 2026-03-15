import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// POST /api/subscriptions/:id/resume
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

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { business: true }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (subscription.status !== 'paused') {
      return NextResponse.json({ 
        error: 'Only paused subscriptions can be resumed',
        currentStatus: subscription.status 
      }, { status: 400 })
    }

    // Calculate next bill date from now
    const nextBillDate = new Date()
    const interval = subscription.billingInterval || 1
    const unit = subscription.billingIntervalUnit || 'month'
    
    if (unit === 'month') {
      nextBillDate.setMonth(nextBillDate.getMonth() + interval)
    } else if (unit === 'week') {
      nextBillDate.setDate(nextBillDate.getDate() + (interval * 7))
    } else if (unit === 'year') {
      nextBillDate.setFullYear(nextBillDate.getFullYear() + interval)
    } else if (unit === 'day') {
      nextBillDate.setDate(nextBillDate.getDate() + interval)
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'active',
        pausedAt: null,
        nextBillDate
      }
    })

    return NextResponse.json({
      success: true,
      subscription: updated
    })

  } catch (error) {
    console.error('Error resuming subscription:', error)
    return NextResponse.json({ 
      error: 'Failed to resume subscription' 
    }, { status: 500 })
  }
}