import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getGateways() {
  const { prisma } = await import('@/lib/prisma')
  return prisma.paymentGateway.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
}

export default async function NewSubscriptionProductPage() {
  const gateways = await getGateways()

  async function createProduct(formData: FormData) {
    'use server'
    
    const { prisma } = await import('@/lib/prisma')
    
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string) || 0
    const interval = formData.get('interval') as string || 'month'
    const intervalCount = parseInt(formData.get('intervalCount') as string) || 1
    const gatewayId = formData.get('gatewayId') as string || null
    
    await prisma.subscriptionProduct.create({
      data: {
        name,
        description: description || null,
        price,
        interval,
        intervalCount,
        gatewayId: gatewayId || null,
        showOnCheckout: true,
        isActive: true
      }
    })
    
    revalidatePath('/subscription-products')
    redirect('/subscription-products')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add Subscription Product</h1>
        <p className="text-slate-500 mt-1">Create a new subscription product</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <form action={createProduct} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="e.g., Monthly Membership"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              placeholder="e.g., Access to premium features"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1">
              Price (USD) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                id="price"
                name="price"
                required
                step="0.01"
                min="0"
                placeholder="9.00"
                className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Billing Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="interval" className="block text-sm font-medium text-slate-700 mb-1">
                Billing Interval
              </label>
              <select
                id="interval"
                name="interval"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month" selected>Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
            <div>
              <label htmlFor="intervalCount" className="block text-sm font-medium text-slate-700 mb-1">
                Every X periods
              </label>
              <input
                type="number"
                id="intervalCount"
                name="intervalCount"
                min="1"
                defaultValue="1"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Gateway Assignment */}
          <div>
            <label htmlFor="gatewayId" className="block text-sm font-medium text-slate-700 mb-1">
              Assign Gateway (MID)
            </label>
            <select
              id="gatewayId"
              name="gatewayId"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Not assigned</option>
              {gateways.map(gw => (
                <option key={gw.id} value={gw.id}>
                  {gw.displayName || gw.name} {gw.nmiMerchantId ? `(${gw.nmiMerchantId})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Payments for this product will be routed to this gateway
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Product
            </button>
            <a
              href="/subscription-products"
              className="px-6 py-2.5 text-slate-600 font-medium hover:text-slate-900 transition-colors"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}