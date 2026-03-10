export default async function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Account</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-xl font-bold">A</span>
            </div>
            <div>
              <div className="text-lg font-medium text-slate-900">Admin</div>
              <div className="text-slate-500">admin@mellone.co</div>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            To change your password, update the ADMIN_PASSWORD environment variable in your deployment settings on Render.
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Quick Links</h2>
        </div>
        <div className="divide-y divide-slate-100">
          <a
            href="/gateways"
            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-slate-900">Payment Gateways</div>
                <div className="text-sm text-slate-500">Manage your payment processors</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="/stores"
            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-slate-900">Shopify Stores</div>
                <div className="text-sm text-slate-500">Manage connected stores</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      {/* Environment */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3">Environment Variables</h3>
        <p className="text-sm text-slate-600 mb-4">
          Configure these in your Render dashboard under Environment:
        </p>
        <div className="space-y-2 font-mono text-sm">
          <div className="bg-white rounded-lg px-3 py-2 border border-slate-200">
            <span className="text-slate-500">ADMIN_EMAIL</span>
            <span className="text-slate-400 ml-2">= admin@mellone.co</span>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 border border-slate-200">
            <span className="text-slate-500">ADMIN_PASSWORD</span>
            <span className="text-slate-400 ml-2">= ••••••••••</span>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 border border-slate-200">
            <span className="text-slate-500">DATABASE_URL</span>
            <span className="text-slate-400 ml-2">= postgresql://...</span>
          </div>
        </div>
      </div>
    </div>
  )
}