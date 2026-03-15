import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// POST /api/subscriptions/:id/charge
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await isAuthenticated()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        business: true,
        customer: true
      }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Get gateway
    const gateway = await prisma.paymentGateway.findFirst({
      where: {
        businessId: subscription.businessId,
        isActive: true,
        OR: [
          { id: subscription.gatewayId },
          { isDefault: true }
        ]
      }
    })

    if (!gateway) {
      return NextResponse.json({ error: 'No payment gateway configured' }, { status: 400 })
    }

    // Charge using stored CAVV
    const NMI_URL = `https://${gateway.nmiEndpoint || 'seamlesschex.transactiongateway.com'}/api/transact.php`
    
    const params = new URLSearchParams({
      username: gateway.nmiSecurityKey,
      password: '',
      type: 'sale',
      amount: subscription.price.toFixed(2),
      customer_vault_id: subscription.paymentMethodId || '',
      cardholder_auth: subscription.cavv ? 'verified' : '',
      cavv: subscription.cavv || '',
      email: subscription.customer?.email || '',
      first_name: subscription.customer?.firstName || '',
      last_name: subscription.customer?.lastName || '',
      orderid: `manual_${subscription.id}_${Date.now()}`,
      order_description: `Manual charge: ${subscription.name}`
    })

    console.log(`[Manual Charge] Charging subscription ${subscription.id}: $${subscription.price}`)

    const response = await fetch(NMI_URL, {
      method: 'POST',
      body: params
    })

    const text = await response.text()
    const result = Object.fromEntries(new URLSearchParams(text))

    if (result.response === '1') {
      // Success
      const transaction = await prisma.transaction.create({
        data: {
          businessId: subscription.businessId,
          customerId: subscription.customerId,
          subscriptionId: subscription.id,
          orderId: subscription.orderId,
          amount: subscription.price,
          status: 'success',
          type: 'manual',
          gatewayId: gateway.id,
          nmiTransactionId: result.transactionid,
          nmiAuthCode: result.authcode || '',
          nmiResponse: JSON.stringify(result)
        }
      })

      // Update subscription dates
      const nextBillDate = new Date()
      const interval = subscription.billingInterval || 1
      const unit = subscription.billingIntervalUnit || 'month'
      
      if (unit === 'month') {
        nextBillDate.setMonth(nextBillDate.getMonth() + interval)
      } else if (unit === 'week') {
        nextBillDate.setDate(nextBillDate.getDate() + (interval * 7))
      } else if (unit === 'year') {
        nextBillDate.setFullYear(nextBillDate.getFullYear() + interval)
      } else if (unit === 'day') {
        nextBillDate.setDate(nextBillDate.getDate() + interval)
      }

      await prisma.subscription.update({
        where: { id },
        data: {
          lastBillDate: new Date(),
          nextBillDate,
          status: 'active',
          retryCount: 0
        }
      })

      return NextResponse.json({
        success: true,
        transaction,
        message: `Charged $${subscription.price.toFixed(2)} successfully`
      })

    } else {
      // Failed
      const transaction = await prisma.transaction.create({
        data: {
          businessId: subscription.businessId,
          customerId: subscription.customerId,
          subscriptionId: subscription.id,
          orderId: subscription.orderId,
          amount: subscription.price,
          status: 'declined',
          type: 'manual',
          gatewayId: gateway.id,
          declineCode: result.response_code || 'UNKNOWN',
          declineReason: result.responsetext || 'Charge failed',
          nmiResponse: JSON.stringify(result)
        }
      })

      return NextResponse.json({
        success: false,
        error: result.responsetext || 'Charge failed',
        declineCode: result.response_code,
        transaction
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Manual charge error:', error)
    return NextResponse.json({ 
      error: 'Failed to process charge',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}