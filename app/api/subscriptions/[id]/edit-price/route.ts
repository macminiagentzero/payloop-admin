import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { id } = await params
    const formData = await request.formData()
    const price = parseFloat(formData.get('price') as string)
    const orderId = formData.get('orderId') as string

    if (isNaN(price) || price < 0) {
      return NextResponse.redirect(new URL(`/orders/${orderId}?error=Invalid+price`, request.url))
    }

    // Update subscription directly in database
    const subscription = await prisma.subscription.update({
      where: { id },
      data: { price }
    })

    console.log('Updated subscription price:', subscription.id, 'to $' + price)

    // Redirect back to order
    return NextResponse.redirect(new URL(`/orders/${orderId}?success=price+updated`, request.url))
  } catch (error) {
    console.error('Edit price error:', error)
    return NextResponse.redirect(new URL('/orders?error=Failed+to+update', request.url))
  }
}