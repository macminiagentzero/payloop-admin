import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

const CHECKOUT_API = process.env.CHECKOUT_API || 'https://payloop-checkout.onrender.com'
const AUTH_SECRET = process.env.AUTH_SECRET

// Generate auth token for checkout API
function generateAuthToken(): string {
  const timestamp = Date.now()
  const email = 'admin@mellone.co'
  const data = `${timestamp}:${email}:${AUTH_SECRET}`
  return Buffer.from(data).toString('base64')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    
    // Check if this is a form submission
    const contentType = request.headers.get('content-type') || ''
    const isForm = contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')
    
    let orderId: string | null = null
    if (isForm) {
      const formData = await request.formData()
      orderId = formData.get('orderId') as string | null
    }

    // Check subscription exists and has token
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { customer: true }
    })

    if (!subscription) {
      const errorMsg = 'Subscription not found'
      if (orderId) return NextResponse.redirect(new URL(`/orders/${orderId}?error=${encodeURIComponent(errorMsg)}`, request.url))
      return NextResponse.json({ error: errorMsg }, { status: 404 })
    }

    if (!subscription.basisTheoryTokenId && !subscription.nmiVaultId) {
      const errorMsg = 'No payment method stored for this subscription'
      if (orderId) return NextResponse.redirect(new URL(`/orders/${orderId}?error=${encodeURIComponent(errorMsg)}`, request.url))
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    // Generate auth token for checkout API
    const token = generateAuthToken()

    // Call checkout API to charge
    const res = await fetch(`${CHECKOUT_API}/api/subscriptions/${id}/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Charge failed:', data)
      const errorMsg = data.error || 'Charge failed'
      if (orderId) return NextResponse.redirect(new URL(`/orders/${orderId}?error=${encodeURIComponent(errorMsg)}`, request.url))
      return NextResponse.json(data, { status: res.status })
    }

    console.log('Charge successful:', data.transactionId)
    const successMsg = `Charged $${(subscription.price || 0).toFixed(2)} - TX: ${data.transactionId}`
    
    if (orderId) {
      return NextResponse.redirect(new URL(`/orders/${orderId}?success=${encodeURIComponent(successMsg)}`, request.url))
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Charge subscription error:', error)
    return NextResponse.json({ error: 'Failed to charge subscription' }, { status: 500 })
  }
}