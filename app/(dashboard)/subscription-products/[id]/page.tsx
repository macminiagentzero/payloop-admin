import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

async function getProduct(id: string) {
  return prisma.subscriptionProduct.findUnique({
    where: { id }
  })
}

async function getGateways() {
  return prisma.paymentGateway.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
}

export default async function EditSubscriptionProductPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, gateways] = await Promise.all([
    getProduct(id),
    getGateways()
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Subscription Product</h1>
          <p className="text-slate-500 mt-1">Update product details and gateway assignment</p>
        </div>
        <Link
          href="/subscription-products"
          className="text-slate-600 hover:text-slate-900"
        >
          ← Back to Products
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <form action={async (formData: FormData) => {
          'use server'
          
          const name = formData.get('name') as string
          const description = formData.get('description') as string
          const price = parseFloat(formData.get('price') as string) || 0
          const interval = formData.get('interval') as string
          const intervalCount = parseInt(formData.get('intervalCount') as string) || 1
          const gatewayId = formData.get('gatewayId') as string
          const showOnCheckout = formData.get('showOnCheckout') === 'on'

          await prisma.subscriptionProduct.update({
            where: { id },
            data: {
              name,
              description: description || null,
              price,
              interval,
              intervalCount,
              gatewayId: gatewayId || null,
              showOnCheckout,
              updatedAt: new Date()
            }
          })

          redirect('/subscription-products')
        }} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={product.name}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Monthly Membership"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={product.description || ''}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Access to premium features"
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1">
              Price (USD) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-500">$</span>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                min="0"
                required
                defaultValue={product.price || 0}
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="interval" className="block text-sm font-medium text-slate-700 mb-1">
                Billing Interval
              </label>
              <select
                id="interval"
                name="interval"
                defaultValue={product.interval || 'month'}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
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
                defaultValue={product.intervalCount || 1}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="gatewayId" className="block text-sm font-medium text-slate-700 mb-1">
              Assign Gateway (MID)
            </label>
            <select
              id="gatewayId"
              name="gatewayId"
              defaultValue={product.gatewayId || ''}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Not assigned</option>
              {gateways.map(gw => (
                <option key={gw.id} value={gw.id}>
                  {gw.displayName || gw.name} {gw.nmiMerchantId && `(${gw.nmiMerchantId})`}
                </option>
              ))}
            </select>
            <p className="text-sm text-slate-500 mt-1">
              Payments for this product will be routed to this gateway
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showOnCheckout"
              name="showOnCheckout"
              defaultChecked={product.showOnCheckout !== false}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
            />
            <label htmlFor="showOnCheckout" className="ml-2 block text-sm text-slate-700">
              Show on checkout page
            </label>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Save Changes
            </button>
            <Link
              href="/subscription-products"
              className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <form action={async () => {
              'use server'
              await prisma.subscriptionProduct.update({
                where: { id },
                data: { isActive: false }
              })
              redirect('/subscription-products')
            }} className="ml-auto">
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                onClick={(e) => {
                  if (!confirm('Are you sure you want to delete this product?')) {
                    e.preventDefault()
                  }
                }}
              >
                Delete Product
              </button>
            </form>
          </div>
        </form>
      </div>
    </div>
  )
}