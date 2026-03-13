import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

const CHECKOUT_URL = process.env.CHECKOUT_URL || 'https://payloop-checkout.onrender.com'

// Login to checkout API and get valid token
async function getCheckoutToken(): Promise<string | null> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mellone.co'
  const adminPassword = process.env.ADMIN_PASSWORD
  
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not set')
    return null
  }
  
  try {
    const res = await fetch(`${CHECKOUT_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    })
    
    const data = await res.json()
    
    if (data.success && data.token) {
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
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { transactionId, amount, reason } = body

    console.log('>>> Admin refund request for order:', id, 'transaction:', transactionId || 'initial')

    // Get auth token from checkout API
    const token = await getCheckoutToken()
    
    if (!token) {
      return NextResponse.json({ error: 'Failed to authenticate with checkout service' }, { status: 500 })
    }

    const response = await fetch(`${CHECKOUT_URL}/api/orders/${id}/refund`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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