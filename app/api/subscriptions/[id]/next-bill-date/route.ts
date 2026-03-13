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
    const nextBillDate = formData.get('nextBillDate') as string

    if (!nextBillDate) {
      return NextResponse.json({ error: 'Next bill date is required' }, { status: 400 })
    }

    const parsedDate = new Date(nextBillDate)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        nextBillDate: parsedDate
      }
    })

    // Redirect back to subscription page
    return NextResponse.redirect(new URL(`/subscriptions/${id}?updated=true`, request.url))
  } catch (error: any) {
    console.error('Update next bill date error:', error)
    return NextResponse.json({ error: 'Failed to update next bill date' }, { status: 500 })
  }
}