import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// POST /api/subscriptions/:id/pause
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await isAuthenticated()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
      include: { business: true }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (subscription.status !== 'active') {
      return NextResponse.json({ 
        error: 'Only active subscriptions can be paused',
        currentStatus: subscription.status 
      }, { status: 400 })
    }

    const updated = await prisma.subscription.update({
      where: { id: params.id },
      data: {
        status: 'paused',
        pausedAt: new Date()
      }
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        businessId: subscription.businessId,
        type: 'subscription.paused',
        description: `Subscription "${subscription.name}" paused`,
        metadata: {
          subscriptionId: subscription.id,
          customerId: subscription.customerId
        }
      }
    }).catch(() => {}) // Ignore if activity log doesn't exist

    return NextResponse.json({
      success: true,
      subscription: updated
    })

  } catch (error) {
    console.error('Error pausing subscription:', error)
    return NextResponse.json({ 
      error: 'Failed to pause subscription' 
    }, { status: 500 })
  }
}