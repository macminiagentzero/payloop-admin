import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

const CHECKOUT_URL = process.env.CHECKOUT_URL || 'https://payloop-checkout.onrender.com'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { transactionId, amount, reason } = body

    console.log('>>> Admin refund request for order:', id, 'transaction:', transactionId || 'initial')

    const response = await fetch(`${CHECKOUT_URL}/api/orders/${id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, amount, reason })
    })

    const data = await response.json()

    if (!response.ok) {
      console.log('>>> Refund failed:', data)
      return NextResponse.json(data, { status: response.status })
    }

    console.log('>>> Refund success:', data)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Refund error:', error)
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 })
  }
}