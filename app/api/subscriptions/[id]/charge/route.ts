import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

const CHECKOUT_API = process.env.CHECKOUT_API || 'https://payloop-checkout.onrender.com'
const ADMIN_URL = process.env.ADMIN_URL || 'https://payloop-admin.onrender.com'

// Login to checkout API and get valid token
async function getCheckoutToken(): Promise<string | null> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mellone.co'
  const adminPassword = process.env.ADMIN_PASSWORD
  
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not set')
    return null
  }
  
  try {
    const res = await fetch(`${CHECKOUT_API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    })
    
    const data = await res.json()
    
    if (data.success && data.token) {
      console.log('Got checkout auth token')
      return data.token
    }
    
    console.error('Failed to get checkout token:', data.error)
    return null
  } catch (error) {
    console.error('Error getting checkout token:', error)
    return null
  }
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
      if (orderId) return NextResponse.redirect(`${ADMIN_URL}/orders/${orderId}?error=${encodeURIComponent(errorMsg)}`)
      return NextResponse.json({ error: errorMsg }, { status: 404 })
    }

    if (!subscription.basisTheoryTokenId && !subscription.nmiVaultId) {
      const errorMsg = 'No payment method stored for this subscription'
      if (orderId) return NextResponse.redirect(`${ADMIN_URL}/orders/${orderId}?error=${encodeURIComponent(errorMsg)}`)
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    // Get auth token from checkout API
    const token = await getCheckoutToken()
    
    if (!token) {
      const errorMsg = 'Failed to authenticate with checkout service'
      if (orderId) return NextResponse.redirect(`${ADMIN_URL}/orders/${orderId}?error=${encodeURIComponent(errorMsg)}`)
      return NextResponse.json({ error: errorMsg }, { status: 500 })
    }

    console.log('Charging subscription:', id, 'Amount:', subscription.price)

    // Call checkout API to charge
    const res = await fetch(`${CHECKOUT_API}/api/subscriptions/${id}/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await res.json()

    console.log('>>> Admin API: Checkout response status:', res.status)
    console.log('>>> Admin API: Checkout response data:', JSON.stringify(data))

    if (!res.ok) {
      console.error('Charge failed:', data)
      const errorMsg = data.error || 'Charge failed'
      if (orderId) return NextResponse.redirect(`${ADMIN_URL}/orders/${orderId}?error=${encodeURIComponent(errorMsg)}`)
      return NextResponse.json(data, { status: res.status })
    }

    console.log('Charge successful:', data.transactionId)
    const successMsg = `Charged $${(subscription.price || 0).toFixed(2)} - TX: ${data.transactionId}`
    
    if (orderId) {
      return NextResponse.redirect(`${ADMIN_URL}/orders/${orderId}?success=${encodeURIComponent(successMsg)}`)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Charge subscription error:', error)
    console.error('Charge subscription error stack:', error?.stack)
    console.error('Charge subscription error message:', error?.message)
    return NextResponse.json({ error: 'Failed to charge subscription', details: error?.message || 'Unknown error' }, { status: 500 })
  }
}