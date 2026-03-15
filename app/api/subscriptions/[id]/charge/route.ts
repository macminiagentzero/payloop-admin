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
    
    // Get the 'from' query parameter to know where to redirect
    const url = new URL(request.url)
    const from = url.searchParams.get('from') || 'subscriptions'
    
    // Build redirect base URL
    const host = request.headers.get('host') || 'crm.mypayloop.co'
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const baseUrl = `${protocol}://${host}`

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

    // Check for payment method
    const hasVaultId = !!subscription.nmiVaultId
    const hasBasisTheoryToken = !!subscription.basisTheoryTokenId
    
    if (!hasVaultId && !hasBasisTheoryToken) {
      return NextResponse.json({ 
        error: 'No payment method stored', 
        details: 'Subscription missing payment method - cannot charge'
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
    console.log(`[Manual Charge] Payment Method: ${hasVaultId ? 'NMI Vault' : 'Basis Theory Token'}`)
    console.log(`[Manual Charge] Has CAVV: ${!!subscription.threeDSCavv}`)

    let result: { success: boolean; transactionId?: string; authCode?: string; message?: string; error?: string; response_code?: string }

    if (hasBasisTheoryToken) {
      // Charge via Basis Theory Proxy
      result = await chargeViaBasisTheory(subscription, gateway)
    } else {
      // Charge via NMI Vault
      result = await chargeViaNMI(subscription, gateway)
    }

    if (result.success) {
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
          transactionId: result.transactionId,
          authCode: result.authCode || '',
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

      // Redirect back with success message
      if (from === 'order') {
        return NextResponse.redirect(new URL(`${baseUrl}/orders/${subscription.orderId}?success=Charged%20$${subscription.price.toFixed(2)}%20successfully`))
      } else {
        return NextResponse.redirect(new URL(`${baseUrl}/subscriptions/${id}?success=Charged%20$${subscription.price.toFixed(2)}%20successfully`))
      }

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
          declineCode: result.response_code || 'UNKNOWN',
          declineReason: result.error || result.message || 'Charge failed'
        }
      })

      // Redirect back with error message
      if (from === 'order') {
        return NextResponse.redirect(new URL(`${baseUrl}/orders/${subscription.orderId}?error=${encodeURIComponent(result.error || result.message || 'Charge failed')}`))
      } else {
        return NextResponse.redirect(new URL(`${baseUrl}/subscriptions/${id}?error=${encodeURIComponent(result.error || result.message || 'Charge failed')}`))
      }
    }

  } catch (error) {
    console.error('Manual charge error:', error)
    // Redirect back with error
    const { id } = await props.params
    const url = new URL(request.url)
    const from = url.searchParams.get('from') || 'subscriptions'
    const host = request.headers.get('host') || 'crm.mypayloop.co'
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const baseUrl = `${protocol}://${host}`
    
    return NextResponse.redirect(new URL(`${baseUrl}/subscriptions/${id}?error=${encodeURIComponent(error instanceof Error ? error.message : 'Failed to process charge')}`))
  }
}

// Charge via Basis Theory Proxy
async function chargeViaBasisTheory(subscription: any, gateway: any) {
  const BT_PRIVATE_KEY = process.env.BT_PRIVATE_KEY
  
  if (!BT_PRIVATE_KEY) {
    return { success: false, error: 'Basis Theory not configured' }
  }

  console.log('[Manual Charge] Charging via Basis Theory Proxy...')
  console.log('[Manual Charge] Token:', subscription.basisTheoryTokenId)
  console.log('[Manual Charge] Gateway:', gateway.name)
  console.log('[Manual Charge] Has CAVV:', !!subscription.threeDSCavv)

  // Basis Theory proxy requires specific endpoint
  const NMI_PROXY_URL = 'https://secure.safewebservices.com/api/transact.php'

  const nmiData = new URLSearchParams({
    type: 'sale',
    security_key: gateway.nmiSecurityKey,
    amount: subscription.price.toFixed(2),
    ccnumber: `{{ token: ${subscription.basisTheoryTokenId} | json: "$.data.number" }}`,
    ccexp: `{{ token: ${subscription.basisTheoryTokenId} | json: "$.data" | card_exp: "MMYY" }}`,
    cvv: '',
    firstname: subscription.customer?.firstName || '',
    lastname: subscription.customer?.lastName || '',
    email: subscription.customer?.email || '',
    initiator: 'merchant',
    orderid: `manual_${subscription.id}_${Date.now()}`,
    order_description: `Manual charge: ${subscription.name || 'Subscription'}`,
    // 3DS data for liability shift
    ...(subscription.threeDSCavv && {
      cardholder_auth: 'verified',
      cavv: subscription.threeDSCavv,
      directory_server_id: subscription.threeDSXid || '',
      eci: subscription.threeDSEci || ''
    })
  })

  console.log('[Manual Charge] Request to Basis Theory Proxy...')

  try {
    const response = await fetch('https://api.basistheory.com/proxy', {
      method: 'POST',
      headers: {
        'BT-API-KEY': BT_PRIVATE_KEY,
        'BT-PROXY-URL': NMI_PROXY_URL,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: nmiData
    })

    const text = await response.text()
    console.log('[Manual Charge] Basis Theory Response:', text)
    
    const result = Object.fromEntries(new URLSearchParams(text))

    if (result.response === '1') {
      return {
        success: true,
        transactionId: result.transactionid as string,
        authCode: result.authcode as string
      }
    } else {
      return {
        success: false,
        error: result.responsetext as string || 'Charge failed',
        response_code: result.response_code as string
      }
    }
  } catch (error) {
    console.error('[Manual Charge] Basis Theory error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Basis Theory request failed'
    }
  }
}

// Charge via NMI Vault
async function chargeViaNMI(subscription: any, gateway: any) {
  const NMI_URL = `https://${gateway.nmiEndpoint || 'seamlesschex.transactiongateway.com'}/api/transact.php`
  
  const body = new URLSearchParams({
    username: gateway.nmiSecurityKey || '',
    password: '',
    type: 'sale',
    amount: subscription.price.toFixed(2),
    customer_vault_id: subscription.nmiVaultId!,
    cardholder_auth: subscription.threeDSCavv ? 'verified' : '',
    cavv: subscription.threeDSCavv || '',
    email: subscription.customer?.email || '',
    first_name: subscription.customer?.firstName || '',
    last_name: subscription.customer?.lastName || '',
    orderid: `manual_${subscription.id}_${Date.now()}`,
    order_description: `Manual charge: ${subscription.name || 'Subscription'}`
  })

  console.log('[Manual Charge] Charging via NMI Vault...')

  try {
    const response = await fetch(NMI_URL, {
      method: 'POST',
      body
    })

    const text = await response.text()
    console.log('[Manual Charge] NMI Response:', text)
    
    const result = Object.fromEntries(new URLSearchParams(text))

    if (result.response === '1') {
      return {
        success: true,
        transactionId: result.transactionid as string,
        authCode: result.authcode as string
      }
    } else {
      return {
        success: false,
        error: result.responsetext as string || 'Charge failed',
        response_code: result.response_code as string
      }
    }
  } catch (error) {
    console.error('[Manual Charge] NMI error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'NMI request failed'
    }
  }
}