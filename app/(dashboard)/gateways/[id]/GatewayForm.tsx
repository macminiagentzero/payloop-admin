'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Gateway {
  id: string
  name: string
  displayName: string | null
  type: string
  nmiMerchantId: string | null
  nmiEndpoint: string | null
  nmiSecurityKey: string | null
  monthlyCap?: number | null
  isActive: boolean
  isDefault: boolean
}

interface Props {
  gateway: Gateway
}

export default function GatewayForm({ gateway }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    
    const data = {
      name: formData.get('name'),
      displayName: formData.get('displayName'),
      type: formData.get('type'),
      merchantId: formData.get('merchantId'),
      monthlyCap: formData.get('monthlyCap'),
      endpoint: formData.get('endpoint'),
      securityKey: formData.get('securityKey'),
      isActive: formData.has('isActive'),
      isDefault: formData.has('isDefault')
    }

    try {
      const res = await fetch(`/api/gateways/${gateway.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Gateway saved successfully!' })
        router.refresh()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save gateway' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/gateways/${gateway.id}/test`, {
        method: 'POST'
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: `Connection successful! Response: ${data.responseText || data.response}` })
      } else {
        setMessage({ type: 'error', text: `Connection failed: ${data.error || data.responseText}` })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Test failed. Please try again.' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <>
      <form id="gateway-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        <input type="hidden" name="gatewayId" value={gateway.id} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Gateway Name
            </label>
            <input
              type="text"
              name="name"
              defaultValue={gateway.name}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., rcdronez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              defaultValue={gateway.displayName || ''}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., RCDRONEZ.COM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Gateway Type
            </label>
            <select
              name="type"
              defaultValue={gateway.type}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="NMI">NMI / Seamless Chex</option>
              <option value="STRIPE">Stripe</option>
              <option value="PAYPAL">PayPal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Merchant ID
            </label>
            <input
              type="text"
              name="merchantId"
              defaultValue={gateway.nmiMerchantId || ''}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., 500001750"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Monthly Cap (USD)
            </label>
            <input
              type="number"
              name="monthlyCap"
              defaultValue={gateway.monthlyCap || ''}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., 100000 for $100k/month"
            />
            <p className="mt-1 text-sm text-slate-500">
              Maximum monthly processing volume for this MID
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            API Endpoint
          </label>
          <input
            type="text"
            name="endpoint"
            defaultValue={gateway.nmiEndpoint || ''}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="https://seamlesschex.transactiongateway.com/api/transact.php"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Security Key
          </label>
          <input
            type="password"
            name="securityKey"
            defaultValue=""
            placeholder="Leave blank to keep existing key"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {gateway.nmiSecurityKey && (
            <p className="mt-1 text-sm text-slate-500">
              Current key: {gateway.nmiSecurityKey}
            </p>
          )}
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={gateway.isActive}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Active</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isDefault"
              defaultChecked={gateway.isDefault}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Default Gateway</span>
          </label>
        </div>
      </form>

      {/* Message */}
      {message && (
        <div className={`mx-6 mb-4 px-4 py-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4 px-6">
        <button
          type="submit"
          form="gateway-form"
          disabled={saving}
          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
    </>
  )
}