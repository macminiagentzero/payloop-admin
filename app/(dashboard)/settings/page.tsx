import { prisma } from '@/lib/prisma'

export default async function SettingsPage() {
  const gateways = await prisma.paymentGateway.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Configure your payment gateways and settings</p>
      </div>

      {/* Payment Gateways */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Payment Gateways</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your payment processors</p>
        </div>
        
        {gateways.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">💳</div>
            <p className="text-slate-500">No payment gateways configured yet</p>
            <p className="text-sm text-slate-400 mt-2">Gateways will appear here when added via the checkout system</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {gateways.map((gateway) => (
              <div key={gateway.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    gateway.isActive ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    <span className="text-xl">💳</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{gateway.displayName}</span>
                      {gateway.isDefault && (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">{gateway.type.toUpperCase()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    gateway.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {gateway.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Account</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 text-xl font-bold">A</span>
            </div>
            <div>
              <div className="font-medium text-slate-900">Admin</div>
              <div className="text-sm text-slate-500">admin@mellone.co</div>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            To change your password, update the ADMIN_PASSWORD environment variable in your deployment.
          </p>
        </div>
      </div>
    </div>
  )
}