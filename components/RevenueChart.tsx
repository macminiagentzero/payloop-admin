'use client'

interface RevenueData {
  total: number
  createdAt: Date
}

interface Props {
  data: RevenueData[]
}

export default function RevenueChart({ data }: Props) {
  // Group by day
  const dailyRevenue: Record<string, number> = {}
  
  data.forEach(order => {
    const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    dailyRevenue[date] = (dailyRevenue[date] || 0) + (order.total || 0)
  })

  const days = Object.keys(dailyRevenue).slice(-7)
  const values = days.map(day => dailyRevenue[day])
  const maxValue = Math.max(...values, 1)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue (Last 7 Days)</h3>
      
      <div className="h-48 flex items-end gap-2">
        {days.map((day, index) => {
          const height = (values[index] / maxValue) * 100
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center">
                <span className="text-xs text-slate-500 mb-1">
                  ${values[index].toFixed(0)}
                </span>
                <div 
                  className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-sm transition-all hover:from-indigo-600 hover:to-indigo-500"
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 mt-1">{day}</span>
            </div>
          )
        })}
      </div>
      
      {days.length === 0 && (
        <div className="h-48 flex items-center justify-center text-slate-400">
          No revenue data yet
        </div>
      )}
    </div>
  )
}