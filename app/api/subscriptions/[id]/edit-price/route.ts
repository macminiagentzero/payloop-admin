import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CHECKOUT_API = process.env.CHECKOUT_API || 'https://payloop-checkout.onrender.com'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()
    const price = formData.get('price')
    const orderId = formData.get('orderId')
    
    // Auth check
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Update subscription price
    const res = await fetch(`${CHECKOUT_API}/api/subscriptions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ price: parseFloat(price as string) })
    })

    if (!res.ok) {
      const error = await res.json()
      console.error('Failed to update price:', error)
    }

    // Redirect back to order
    return NextResponse.redirect(new URL(`/orders/${orderId}`, request.url))
  } catch (error) {
    console.error('Edit price error:', error)
    return NextResponse.redirect(new URL('/orders', request.url))
  }
}