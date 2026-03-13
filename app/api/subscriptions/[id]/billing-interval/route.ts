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
    const interval = parseInt(formData.get('interval') as string)
    const unit = formData.get('unit') as string

    if (isNaN(interval) || interval < 1 || interval > 12) {
      return NextResponse.json({ error: 'Invalid interval (must be 1-12)' }, { status: 400 })
    }

    if (!['day', 'week', 'month', 'year'].includes(unit)) {
      return NextResponse.json({ error: 'Invalid unit (must be day, week, month, or year)' }, { status: 400 })
    }

    // Calculate next bill date based on interval
    const now = new Date()
    let nextBillDate = new Date(now)
    
    switch (unit) {
      case 'day':
        nextBillDate.setDate(now.getDate() + interval)
        break
      case 'week':
        nextBillDate.setDate(now.getDate() + (interval * 7))
        break
      case 'month':
        nextBillDate.setMonth(now.getMonth() + interval)
        break
      case 'year':
        nextBillDate.setFullYear(now.getFullYear() + interval)
        break
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        billingInterval: interval,
        billingIntervalUnit: unit,
        nextBillDate
      }
    })

    // Redirect back to subscription page
    const baseUrl = process.env.ADMIN_URL || 'https://payloop-admin.onrender.com'
    return NextResponse.redirect(`${baseUrl}/subscriptions/${id}?updated=true`)
  } catch (error: any) {
    console.error('Update billing interval error:', error)
    return NextResponse.json({ error: 'Failed to update billing interval' }, { status: 500 })
  }
}