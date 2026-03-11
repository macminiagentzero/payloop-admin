import { Subscription, Customer, PaymentGateway } from '@prisma/client'

interface SubscriptionWithCustomer extends Subscription {
  customer: Customer | null
  gateway?: PaymentGateway | null
}

interface Props {
  subscriptions: SubscriptionWithCustomer[]
}

export default function SubscriptionsTable({ subscriptions }: Props) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${(amount || 0).toFixed(2)}`
  }

  const getCustomerName = (customer: Customer | null) => {
    if (!customer) return 'Unknown'
    const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
    return name || customer.email
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  if (subscriptions.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-4xl mb-4">🔄</div>
        <p className="text-slate-500">No subscriptions yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Subscription
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Gateway
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Next Bill
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bills
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {subscriptions.map((sub) => (
            <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-900">
                  {sub.name}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  #{sub.id.slice(0, 8)}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-slate-900">
                  {getCustomerName(sub.customer)}
                </div>
                <div className="text-xs text-slate-500">
                  {sub.customer?.email}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(sub.price || 0)}
                </span>
                <div className="text-xs text-slate-400">/month</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-slate-600">
                  {sub.gatewayId ? (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                      {sub.gateway?.displayName || sub.gatewayId.slice(0, 8)}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">Not set</span>
                  )}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusClass(sub.status)}`}>
                  {sub.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {formatDate(sub.nextBillDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <span className="text-sm font-medium text-slate-900">
                  {sub.totalBills || 0}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {formatDate(sub.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}