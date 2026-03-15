import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// Verify DNS configuration for a custom domain
export async function GET(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')

  if (!domain) {
    return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
  }

  try {
    // Expected CNAME target
    const expectedTarget = 'payloop-checkout.onrender.com'
    
    // Try to resolve the domain
    const dns = await resolveDNS(domain)
    
    const isConfigured = dns.cname === expectedTarget || dns.cname?.includes('render.com')
    
    return NextResponse.json({
      domain,
      expected: expectedTarget,
      actual: dns.cname || null,
      configured: isConfigured,
      type: dns.cname ? 'CNAME' : null,
      instructions: !isConfigured ? {
        type: 'CNAME',
        name: domain,
        value: expectedTarget,
        steps: [
          `Go to your DNS provider (GoDaddy, Cloudflare, Namecheap, etc.)`,
          `Find DNS settings for ${domain}`,
          `Add a CNAME record:`,
          `  - Type: CNAME`,
          `  - Name: ${domain.split('.')[0]} (or @ for root)`,
          `  - Value: ${expectedTarget}`,
          `  - TTL: 3600 (or default)`,
          `Wait 5-30 minutes for DNS propagation`,
          `Click "Verify" again`
        ]
      } : null
    })
  } catch (error) {
    console.error('DNS verification error:', error)
    return NextResponse.json({
      domain,
      configured: false,
      error: 'Could not verify DNS configuration',
      instructions: {
        steps: [
          `Add CNAME record pointing ${domain} → payloop-checkout.onrender.com`,
          `Wait 5-30 minutes for DNS propagation`,
          `Click "Verify" again`
        ]
      }
    })
  }
}

// DNS resolution using Node's built-in dns module
async function resolveDNS(domain: string): Promise<{ cname: string | null }> {
  try {
    // Use fetch to call a DNS-over-HTTPS service
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`, {
      signal: AbortSignal.timeout(5000)
    })
    
    const data = await response.json()
    
    if (data.Answer && data.Answer.length > 0) {
      const cname = data.Answer[0].data
      return { cname: cname.replace(/\.$/, '') } // Remove trailing dot
    }
    
    return { cname: null }
  } catch (error) {
    console.error('DNS resolution error:', error)
    return { cname: null }
  }
}