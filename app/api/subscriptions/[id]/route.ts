import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CHECKOUT_API = process.env.CHECKOUT_API || 'https://payloop-checkout.onrender.com'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Get auth token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Forward to checkout API
    const res = await fetch(`${CHECKOUT_API}/api/subscriptions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })
    
    if (!res.ok) {
      const error = await res.json()
      return NextResponse.json(error, { status: res.status })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Update subscription error:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}