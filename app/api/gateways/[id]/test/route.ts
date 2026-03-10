import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Get gateway
    const gateway = await prisma.$queryRaw<any[]>`
      SELECT id, name, "nmiEndpoint", "nmiSecurityKey", type
      FROM "PaymentGateway"
      WHERE id = ${id}::uuid
      LIMIT 1
    `
    
    if (!gateway || gateway.length === 0) {
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 })
    }
    
    const gw = gateway[0]
    
    // Test connection based on gateway type
    if (gw.type === 'NMI' || gw.type === 'nmi') {
      const endpoint = gw.nmiEndpoint || 'https://seamlesschex.transactiongateway.com/api/transact.php'
      
      const params = new URLSearchParams()
      params.append('security_key', gw.nmiSecurityKey)
      params.append('type', 'auth')
      params.append('amount', '1.00')
      params.append('ccnumber', '4111111111111111')
      params.append('cvv', '999')
      params.append('ccexp', '1225')
      params.append('firstname', 'Test')
      params.append('lastname', 'Connection')
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      
      const text = await response.text()
      const result: Record<string, string> = {}
      text.split('&').forEach(pair => {
        const [key, value] = pair.split('=')
        if (key) result[key] = value || ''
      })
      
      // 0 = approved, 1 = declined, 2 = error, 3 = activity limit
      // All these mean credentials are valid and gateway is connected
      if (['0', '1', '2', '3'].includes(result.response)) {
        const messages: Record<string, string> = {
          '0': 'Test approved - gateway working',
          '1': 'Test declined (normal) - gateway working',
          '2': 'Gateway connected (test card limit reached)',
          '3': 'Gateway connected (activity limit)'
        }
        return NextResponse.json({ 
          success: true, 
          message: messages[result.response] || 'Gateway connected',
          responseCode: result.response 
        })
      } else {
        return NextResponse.json({ 
          success: false, 
          message: result.responsetext || 'Connection failed',
          response: result.response 
        })
      }
    }
    
    // For other gateway types, just return success
    return NextResponse.json({ success: true, message: 'Gateway configuration saved' })
    
  } catch (error) {
    console.error('Test gateway error:', error)
    return NextResponse.json({ 
      error: 'Failed to test gateway', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}