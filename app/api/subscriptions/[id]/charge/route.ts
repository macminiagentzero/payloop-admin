import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// POST /api/subscriptions/:id/charge
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await isAuthenticated()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await props.params

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
          ...(subscription.gatewayId ? [{ id: subscription.gatewayId }] : []),
          { isDefault: true }
        ]
      }
    })

    if (!gateway) {
      return NextResponse.json({ error: 'No payment gateway configured' }, { status: 400 })
    }

    // Charge using stored CAVV
    const NMI_URL = `https://${gateway.nmiEndpoint || 'seamlesschex.transactiongateway.com'}/api/transact.php`
    
    const body = new URLSearchParams({
      username: gateway.nmiSecurityKey || '',
      password: '',
      type: 'sale',
      amount: subscription.price.toFixed(2),
      customer_vault_id: subscription.nmiVaultId || '',
      cardholder_auth: subscription.threeDSCavv ? 'verified' : '',
      cavv: subscription.threeDSCavv || '',
      email: subscription.customer?.email || '',
      first_name: subscription.customer?.firstName || '',
      last_name: subscription.customer?.lastName || '',
      orderid: `manual_${subscription.id}_${Date.now()}`,
      order_description: `Manual charge: ${subscription.name || 'Subscription'}`
    })

    if (!subscription.nmiVaultId) {
      return NextResponse.json({ 
        error: 'No payment method stored', 
        details: 'Subscription missing nmiVaultId - cannot charge without stored card'
      }, { status: 400 })
    }

    if (!gateway.nmiSecurityKey) {
      return NextResponse.json({ 
        error: 'Gateway not configured', 
        details: 'Payment gateway missing security key'
      }, { status: 400 })
    }

    console.log(`[Manual Charge] Charging subscription ${subscription.id}: $${subscription.price}`)
    console.log(`[Manual Charge] Gateway: ${gateway.nmiEndpoint || 'seamlesschex.transactiongateway.com'}`)
    console.log(`[Manual Charge] Vault ID: ${subscription.nmiVaultId}`)
    console.log(`[Manual Charge] Has CAVV: ${!!subscription.threeDSCavv}`)

    const response = await fetch(NMI_URL, {
      method: 'POST',
      body
    })

    const text = await response.text()
    console.log(`[Manual Charge] NMI Response:`, text)
    
    const result = Object.fromEntries(new URLSearchParams(text))

    if (result.response === '1') {
      // Success
      const transaction = await prisma.transaction.create({
        data: {
          businessId: subscription.businessId,
          subscriptionId: subscription.id,
          orderId: subscription.orderId,
          amount: subscription.price,
          status: 'approved',
          type: 'manual',
          gatewayId: gateway.id,
          transactionId: result.transactionid as string,
          authCode: result.authcode as string || '',
          cavv: subscription.threeDSCavv || undefined
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
          subscriptionId: subscription.id,
          orderId: subscription.orderId,
          amount: subscription.price,
          status: 'declined',
          type: 'manual',
          gatewayId: gateway.id,
          declineCode: result.response_code as string || 'UNKNOWN',
          declineReason: result.responsetext as string || 'Charge failed'
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
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}