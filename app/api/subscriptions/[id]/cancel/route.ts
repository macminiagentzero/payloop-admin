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

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      }
    })

    // Redirect back to subscriptions page
    const baseUrl = process.env.ADMIN_URL || 'https://payloop-admin.onrender.com'
    return NextResponse.redirect(`${baseUrl}/subscriptions?updated=true`)
  } catch (error: any) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}