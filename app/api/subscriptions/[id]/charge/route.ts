import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CHECKOUT_API = process.env.CHECKOUT_API || 'https://payloop-checkout.onrender.com'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    
    // Get auth token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Charging subscription:', id, 'Amount:', body.amount || 'default')
    
    // Forward to checkout API
    const res = await fetch(`${CHECKOUT_API}/api/subscriptions/${id}/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      console.error('Charge failed:', data)
      return NextResponse.json(data, { status: res.status })
    }
    
    console.log('Charge successful:', data.transactionId)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Charge subscription error:', error)
    return NextResponse.json({ error: 'Failed to charge subscription' }, { status: 500 })
  }
}