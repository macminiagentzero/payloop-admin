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
        status: 'active',
        pausedAt: null
      }
    })

    return NextResponse.json({ success: true, subscription })
  } catch (error: any) {
    console.error('Resume subscription error:', error)
    return NextResponse.json({ error: 'Failed to resume subscription' }, { status: 500 })
  }
}