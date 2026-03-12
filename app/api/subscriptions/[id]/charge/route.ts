import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CHECKOUT_API = process.env.CHECKOUT_API || 'https://payloop-checkout.onrender.com'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Auth check
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Charging subscription:', id)
    
    // Forward to checkout API
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
      if (orderId) {
        return NextResponse.redirect(new URL(`/orders/${orderId}?error=${encodeURIComponent(data.error || 'Charge failed')}`, request.url))
      }
      return NextResponse.json(data, { status: res.status })
    }
    
    console.log('Charge successful:', data.transactionId)
    
    // If form submission, redirect back to order
    if (orderId) {
      return NextResponse.redirect(new URL(`/orders/${orderId}?success=charged`, request.url))
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Charge subscription error:', error)
    return NextResponse.json({ error: 'Failed to charge subscription' }, { status: 500 })
  }
}