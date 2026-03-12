import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ id: string; subscriptionId: string }>
}

export default async function EditSubscriptionPrice({ params }: Props) {
  const { id, subscriptionId } = await params
  
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { customer: true }
  })

  if (!subscription) notFound()

  const gateway = subscription.gatewayId 
    ? await prisma.paymentGateway.findFirst({
        where: { OR: [{ id: subscription.gatewayId }, { name: subscription.gatewayId }] }
      }).catch(() => null)
    : null

  const hasToken = subscription.basisTheoryTokenId || subscription.nmiVaultId

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <a href={`/orders/${id}`} className="text-blue-600 hover:underline">← Back to Order</a>
      
      <div className="bg-white rounded-lg border p-6">
        <h1 className="text-xl font-bold mb-4">Edit Subscription Price</h1>
        
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Subscription</p>
            <p className="font-medium">{subscription.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium">{subscription.customer?.firstName} {subscription.customer?.lastName}</p>
            <p className="text-sm text-gray-500">{subscription.customer?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Gateway</p>
            <p className="font-medium">{gateway?.displayName || gateway?.name || 'Default'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Card on File</p>
            <p className={`font-medium ${hasToken ? 'text-green-600' : 'text-red-500'}`}>
              {hasToken ? '✓ Token saved' : '✗ No token'}
            </p>
          </div>
        </div>

        <form action={`/api/subscriptions/${subscriptionId}/edit-price`} method="POST">
          <input type="hidden" name="orderId" value={id} />
          
          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700">Price (USD/month)</span>
            <div className="mt-1 relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                name="price"
                step="0.01"
                min="0"
                defaultValue={(subscription.price || 0).toFixed(2)}
                className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Save Price
            </button>
            <a
              href={`/orders/${id}`}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-center"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}