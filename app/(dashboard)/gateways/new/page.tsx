'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewGatewayPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    type: 'nmi',
    nmiSecurityKey: '',
    nmiEndpoint: '',
    nmiMerchantId: '',
    isActive: true,
    isDefault: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create gateway')
      }

      router.push('/gateways')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gateway')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/gateways"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Gateways
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h1 className="text-xl font-semibold text-slate-900">Add Payment Gateway</h1>
          <p className="text-sm text-slate-500 mt-1">Configure a new payment processor</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Gateway Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Gateway Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['nmi', 'stripe', 'paypal'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`p-4 rounded-lg border-2 text-center transition-colors ${
                    formData.type === type
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">
                    {type === 'stripe' ? '💳' : type === 'nmi' ? '🏦' : '🅿️'}
                  </span>
                  <span className="text-sm font-medium">{type.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="e.g., RCDRONEZ NMI"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Internal Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              Internal Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., rcdronez-nmi"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <p className="text-sm text-slate-500 mt-1">Used internally for API references</p>
          </div>

          {/* NMI Security Key */}
          {formData.type === 'nmi' && (
            <>
              <div>
                <label htmlFor="nmiSecurityKey" className="block text-sm font-medium text-slate-700 mb-2">
                  NMI Security Key
                </label>
                <input
                  type="password"
                  id="nmiSecurityKey"
                  value={formData.nmiSecurityKey}
                  onChange={(e) => setFormData({ ...formData, nmiSecurityKey: e.target.value })}
                  placeholder="NMI Security Key"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="nmiEndpoint" className="block text-sm font-medium text-slate-700 mb-2">
                  NMI Endpoint (optional)
                </label>
                <input
                  type="text"
                  id="nmiEndpoint"
                  value={formData.nmiEndpoint}
                  onChange={(e) => setFormData({ ...formData, nmiEndpoint: e.target.value })}
                  placeholder="https://seamlesschex.transactiongateway.com/api/transact.php"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="nmiMerchantId" className="block text-sm font-medium text-slate-700 mb-2">
                  Merchant ID (optional)
                </label>
                <input
                  type="text"
                  id="nmiMerchantId"
                  value={formData.nmiMerchantId}
                  onChange={(e) => setFormData({ ...formData, nmiMerchantId: e.target.value })}
                  placeholder="500001750"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </>
          )}

          {/* Stripe/PayPal fields - placeholder for future */}
          {formData.type !== 'nmi' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
              <strong>{formData.type.toUpperCase()}</strong> integration coming soon. Contact support to add this gateway manually.
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">Active (ready to process payments)</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">Default gateway for new transactions</span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Link
              href="/gateways"
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Gateway'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}