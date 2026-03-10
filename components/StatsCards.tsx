interface Stats {
  totalRevenue: number | null
  totalOrders: number
  approvedOrders: number
  declinedOrders: number
  totalCustomers: number
  activeSubscriptions: number
}

interface Props {
  stats: Stats
}

export default function StatsCards({ stats }: Props) {
  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0)
  }

  const cards = [
    {
      name: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: '💰',
      color: 'bg-green-50 text-green-700',
    },
    {
      name: 'Orders',
      value: stats.totalOrders.toString(),
      icon: '📦',
      color: 'bg-blue-50 text-blue-700',
      subtext: `${stats.approvedOrders} approved · ${stats.declinedOrders} declined`,
    },
    {
      name: 'Customers',
      value: stats.totalCustomers.toString(),
      icon: '👥',
      color: 'bg-purple-50 text-purple-700',
    },
    {
      name: 'Active Subscriptions',
      value: stats.activeSubscriptions.toString(),
      icon: '🔄',
      color: 'bg-orange-50 text-orange-700',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.name}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${card.color}`}>
              {card.icon}
            </div>
            <span className="text-sm font-medium text-slate-500">{card.name}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{card.value}</div>
          {card.subtext && (
            <div className="text-xs text-slate-500 mt-1">{card.subtext}</div>
          )}
        </div>
      ))}
    </div>
  )
}