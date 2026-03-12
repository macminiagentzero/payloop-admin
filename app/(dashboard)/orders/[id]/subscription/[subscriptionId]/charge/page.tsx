import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ id: string; subscriptionId: string }>
}

export default async function ChargeSubscription({ params }: Props) {
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
        <h1 className="text-xl font-bold mb-4">Charge Subscription Now</h1>
        
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
            <p className="text-sm text-gray-500">Amount to Charge</p>
            <p className="text-2xl font-bold">${(subscription.price || 0).toFixed(2)}</p>
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
          <div>
            <p className="text-sm text-gray-500">Previous Bills</p>
            <p className="font-medium">{subscription.totalBills || 0}</p>
          </div>
        </div>

        {!hasToken ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">Cannot charge: No card token on file.</p>
          </div>
        ) : subscription.status !== 'active' ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-700">Cannot charge: Subscription is {subscription.status}.</p>
          </div>
        ) : (
          <form action={`/api/subscriptions/${subscriptionId}/charge`} method="POST">
            <input type="hidden" name="orderId" value={id} />
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800">
                ⚠️ This will immediately charge ${(subscription.price || 0).toFixed(2)} to the customer's card on file.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Confirm Charge
              </button>
              <a
                href={`/orders/${id}`}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-center"
              >
                Cancel
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}