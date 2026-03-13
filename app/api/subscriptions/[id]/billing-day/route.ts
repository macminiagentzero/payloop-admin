import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const formData = await request.formData()
    const day = parseInt(formData.get('day') as string)

    if (isNaN(day) || day < 1 || day > 31) {
      return NextResponse.json({ error: 'Invalid billing day (must be 1-31)' }, { status: 400 })
    }

    // Calculate next bill date based on new billing day
    const now = new Date()
    let nextBillDate = new Date(now.getFullYear(), now.getMonth() + 1, day)
    
    // If the day has already passed this month, use next month
    if (nextBillDate <= now) {
      nextBillDate = new Date(now.getFullYear(), now.getMonth() + 2, day)
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        billingDay: day,
        nextBillDate
      }
    })

    // Redirect back to subscription page
    return NextResponse.redirect(new URL(`/subscriptions/${id}?updated=true`, request.url))
  } catch (error: any) {
    console.error('Update billing day error:', error)
    return NextResponse.json({ error: 'Failed to update billing day' }, { status: 500 })
  }
}