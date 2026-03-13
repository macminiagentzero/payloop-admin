import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    
    // Build filter
    const where: any = {}
    const status = searchParams.get('status')
    const gateway = searchParams.get('gateway')
    const search = searchParams.get('search')
    
    if (status && status !== 'all') {
      where.status = status
    }
    if (gateway && gateway !== 'all') {
      where.gatewayId = gateway
    }
    if (search) {
      where.customer = {
        email: { contains: search, mode: 'insensitive' }
      }
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    })

    // Get gateways for names
    const gateways = await prisma.paymentGateway.findMany()
    const gatewayMap = new Map(gateways.map(g => [g.id, g.name]))

    // Build CSV
    const headers = [
      'Subscription ID',
      'Customer Name',
      'Email',
      'Price',
      'Status',
      'Gateway',
      '3DS Protected',
      'Next Bill Date',
      'Total Bills',
      'Created At'
    ]

    const rows = subscriptions.map(sub => [
      sub.id,
      `${sub.customer?.firstName || ''} ${sub.customer?.lastName || ''}`.trim(),
      sub.customer?.email || '',
      (sub.price || 0).toFixed(2),
      sub.status,
      sub.gatewayId ? (gatewayMap.get(sub.gatewayId) || 'Default') : 'Default',
      sub.threeDSCavv ? 'Yes' : 'No',
      sub.nextBillDate ? new Date(sub.nextBillDate).toISOString().split('T')[0] : '',
      sub.totalBills || 0,
      new Date(sub.createdAt).toISOString().split('T')[0]
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="subscriptions-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error: any) {
    console.error('Export subscriptions error:', error)
    return NextResponse.json({ error: 'Failed to export subscriptions' }, { status: 500 })
  }
}