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
      minimumFractionDigits: 2,
    }).format(value || 0)
  }

  const cards = [
    {
      name: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      change: '+12.5%',
      changeType: 'positive',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-100',
      iconBg: 'bg-emerald-500',
      textColor: 'text-emerald-700',
    },
    {
      name: 'Orders',
      value: stats.totalOrders.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      subtext: `${stats.approvedOrders} approved · ${stats.declinedOrders} declined`,
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-100',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-700',
    },
    {
      name: 'Customers',
      value: stats.totalCustomers.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: 'bg-gradient-to-br from-violet-50 to-purple-100',
      iconBg: 'bg-violet-500',
      textColor: 'text-violet-700',
    },
    {
      name: 'Active Subscriptions',
      value: stats.activeSubscriptions.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-100',
      iconBg: 'bg-amber-500',
      textColor: 'text-amber-700',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => (
        <div
          key={card.name}
          className={`${card.bgColor} rounded-xl p-5 border border-white/50 shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`${card.iconBg} p-2.5 rounded-lg text-white`}>
              {card.icon}
            </div>
            <span className="text-sm font-medium text-slate-600">{card.name}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${card.textColor}`}>{card.value}</span>
          </div>
          {card.subtext && (
            <div className="mt-1.5 text-xs text-slate-500">
              {card.subtext}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}