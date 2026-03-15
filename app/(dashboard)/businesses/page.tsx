import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import BusinessList from './BusinessList'

export default async function BusinessesPage() {
  await requireAuth()

  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      customDomain: true,
      defaultDomain: true,
      shopifyDomain: true,
      shopifyStorefrontToken: true,
      shopifyAdminToken: true,
      shopifyWebhookSecret: true,
      stripeApiKey: true,
      stripeWebhookSecret: true,
      checkoutType: true,
      logoUrl: true,
      primaryColor: true,
      accentColor: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
          subscriptions: true,
          customers: true
        }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Businesses</h1>
          <p className="text-slate-500 mt-1">Manage your businesses and their settings</p>
        </div>
      </div>

      <BusinessList businesses={businesses} />
    </div>
  )
}