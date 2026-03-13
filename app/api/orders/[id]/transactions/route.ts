import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

const CHECKOUT_API = process.env.CHECKOUT_API || 'https://payloop-checkout.onrender.com'

// Get auth token from checkout API
async function getCheckoutToken(): Promise<string | null> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mellone.co'
  const adminPassword = process.env.ADMIN_PASSWORD
  
  if (!adminPassword) return null
  
  try {
    const res = await fetch(`${CHECKOUT_API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    })
    const data = await res.json()
    return data.success && data.token ? data.token : null
  } catch {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    
    // Get order to find customerId
    const order = await prisma.order.findUnique({
      where: { id },
      select: { customerId: true }
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    // Get subscriptions for this customer
    const subscriptions = await prisma.subscription.findMany({
      where: { customerId: order.customerId },
      select: { id: true }
    })
    
    const subscriptionIds = subscriptions.map(s => s.id)
    
    // Get transactions directly from database
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { orderId: id },
          { subscriptionId: { in: subscriptionIds } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    
    return NextResponse.json({ 
      success: true, 
      count: transactions.length,
      transactions 
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch transactions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}