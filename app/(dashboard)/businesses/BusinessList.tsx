'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Business {
  id: string
  name: string
  slug: string
  customDomain: string | null
  defaultDomain: string | null
  shopifyDomain: string | null
  shopifyStorefrontToken: string | null
  shopifyAdminToken: string | null
  shopifyWebhookSecret: string | null
  use3ds: boolean
  logoUrl: string | null
  primaryColor: string | null
  accentColor: string | null
  isActive: boolean
  createdAt: Date
  _count?: {
    orders: number
    subscriptions: number
    customers: number
  }
}

interface Props {
  businesses: Business[]
}

export default function BusinessList({ businesses }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    customDomain: '',
    shopifyDomain: '',
    shopifyStorefrontToken: '',
    shopifyAdminToken: '',
    shopifyWebhookSecret: '',
    use3ds: true,
    primaryColor: '#4F46E5',
    accentColor: '#7C3AED'
  })
  
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null)
  const [dnsResult, setDnsResult] = useState<{
    domain: string
    configured: boolean
    actual?: string
    expected?: string
    instructions?: { steps: string[] }
  } | null>(null)
  
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string
    name: string
    counts: { orders: number; subscriptions: number; customers: number }
  } | null>(null)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      customDomain: '',
      shopifyDomain: '',
      shopifyStorefrontToken: '',
      shopifyAdminToken: '',
      shopifyWebhookSecret: '',
      use3ds: true,
      primaryColor: '#4F46E5',
      accentColor: '#7C3AED'
    })
  }
  
  const handleDelete = async () => {
    if (!deleteConfirm || deleteInput !== 'DELETE') return
    setDeleting(true)
    try {
      const res = await fetch(`/api/businesses?id=${deleteConfirm.id}&confirmation=DELETE`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      setDeleteConfirm(null)
      setDeleteInput('')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete business')
    } finally {
      setDeleting(false)
    }
  }
  
  const verifyDNS = async (domain: string) => {
    setVerifyingDomain(domain)
    setDnsResult(null)
    try {
      const res = await fetch(`/api/businesses/verify-dns?domain=${encodeURIComponent(domain)}`)
      const data = await res.json()
      setDnsResult(data)
    } catch (err) {
      setDnsResult({
        domain,
        configured: false,
        instructions: {
          steps: ['Could not verify DNS. Please try again.']
        }
      })
    } finally {
      setVerifyingDomain(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          customDomain: formData.customDomain || null,
          shopifyDomain: formData.shopifyDomain || null,
          shopifyStorefrontToken: formData.shopifyStorefrontToken || null,
          shopifyAdminToken: formData.shopifyAdminToken || null,
          shopifyWebhookSecret: formData.shopifyWebhookSecret || null,
          use3ds: formData.use3ds,
          primaryColor: formData.primaryColor,
          accentColor: formData.accentColor
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create business')
      }

      setShowForm(false)
      resetForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          name: formData.name,
          slug: formData.slug,
          customDomain: formData.customDomain || null,
          shopifyDomain: formData.shopifyDomain || null,
          shopifyStorefrontToken: formData.shopifyStorefrontToken || null,
          shopifyAdminToken: formData.shopifyAdminToken || null,
          shopifyWebhookSecret: formData.shopifyWebhookSecret || null,
          use3ds: formData.use3ds,
          primaryColor: formData.primaryColor,
          accentColor: formData.accentColor
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update business')
      }

      setEditingId(null)
      resetForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update business')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (business: Business) => {
    setEditingId(business.id)
    setFormData({
      name: business.name,
      slug: business.slug,
      customDomain: business.customDomain || '',
      shopifyDomain: business.shopifyDomain || '',
      shopifyStorefrontToken: business.shopifyStorefrontToken || '',
      shopifyAdminToken: business.shopifyAdminToken || '',
      shopifyWebhookSecret: business.shopifyWebhookSecret || '',
      use3ds: business.use3ds ?? true,
      primaryColor: business.primaryColor || '#4F46E5',
      accentColor: business.accentColor || '#7C3AED'
    })
    setShowForm(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    resetForm()
  }

  return (
    <div className="space-y-6">
      {/* Create Button */}
      {!showForm && !editingId && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Business
          </button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Create New Business</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="My Store"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="my-store"
                />
                <p className="text-xs text-slate-500 mt-1">Auto-generated from name if empty</p>
              </div>
            </div>

            {/* Shopify Credentials Section */}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Shopify Credentials (Optional)</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Storefront API Token</label>
                  <input
                    type="password"
                    value={formData.shopifyStorefrontToken}
                    onChange={(e) => setFormData({ ...formData, shopifyStorefrontToken: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="shpat_..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Admin API Token</label>
                  <input
                    type="password"
                    value={formData.shopifyAdminToken}
                    onChange={(e) => setFormData({ ...formData, shopifyAdminToken: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="shpat_..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Webhook Secret</label>
                  <input
                    type="password"
                    value={formData.shopifyWebhookSecret}
                    onChange={(e) => setFormData({ ...formData, shopifyWebhookSecret: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Used to verify webhooks"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Checkout Domain</label>
                <input
                  type="text"
                  value={formData.customDomain}
                  onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="checkout.mystore.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shopify Domain</label>
                <input
                  type="text"
                  value={formData.shopifyDomain}
                  onChange={(e) => setFormData({ ...formData, shopifyDomain: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="mystore.myshopify.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
            {/* Payment Settings */}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Payment Settings</h4>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="use3ds-create"
                  checked={formData.use3ds}
                  onChange={(e) => setFormData({ ...formData, use3ds: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="use3ds-create" className="text-sm text-slate-700">
                  Enable 3DS (3D Secure) for payments
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-7">
                Recommended for high-risk transactions. Disabling may increase fraud liability.
              </p>
            </div>

                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Business'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {editingId && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Edit Business</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Shopify Credentials Section */}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Shopify Credentials (Optional)</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Storefront API Token</label>
                  <input
                    type="password"
                    value={formData.shopifyStorefrontToken}
                    onChange={(e) => setFormData({ ...formData, shopifyStorefrontToken: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="shpat_..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Admin API Token</label>
                  <input
                    type="password"
                    value={formData.shopifyAdminToken}
                    onChange={(e) => setFormData({ ...formData, shopifyAdminToken: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="shpat_..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Webhook Secret</label>
                  <input
                    type="password"
                    value={formData.shopifyWebhookSecret}
                    onChange={(e) => setFormData({ ...formData, shopifyWebhookSecret: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Used to verify webhooks"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Checkout Domain</label>
                <input
                  type="text"
                  value={formData.customDomain}
                  onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="checkout.mystore.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shopify Domain</label>
                <input
                  type="text"
                  value={formData.shopifyDomain}
                  onChange={(e) => setFormData({ ...formData, shopifyDomain: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="mystore.myshopify.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
            {/* Payment Settings */}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Payment Settings</h4>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="use3ds-edit"
                  checked={formData.use3ds}
                  onChange={(e) => setFormData({ ...formData, use3ds: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="use3ds-edit" className="text-sm text-slate-700">
                  Enable 3DS (3D Secure) for payments
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-7">
                Recommended for high-risk transactions. Disabling may increase fraud liability.
              </p>
            </div>

                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Business List */}
      {businesses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No businesses yet</h3>
          <p className="text-slate-500 mb-4">Create your first business to get started.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Business
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Business</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">DNS Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Shopify</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stats</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {businesses.map((business) => (
                <tr key={business.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: business.primaryColor || '#4F46E5' }}
                      >
                        {business.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{business.name}</div>
                        <div className="text-sm text-slate-500">{business.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {business.customDomain ? (
                        <span className="text-sm text-slate-900">{business.customDomain}</span>
                      ) : (
                        <span className="text-sm text-slate-400">No custom domain</span>
                      )}
                      {business.defaultDomain && (
                        <span className="text-xs text-slate-500">
                          Default: {business.defaultDomain}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {business.customDomain ? (
                      <button
                        onClick={() => verifyDNS(business.customDomain!)}
                        disabled={verifyingDomain === business.customDomain}
                        className="text-sm text-indigo-600 hover:text-indigo-900 disabled:text-slate-400"
                      >
                        {verifyingDomain === business.customDomain ? 'Verifying...' : 'Verify DNS'}
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {business.shopifyDomain ? (
                      <span className="text-sm text-slate-900">{business.shopifyDomain}</span>
                    ) : (
                      <span className="text-sm text-slate-400">Not connected</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">{business._count?.orders || 0}</span> orders,{' '}
                      <span className="font-medium">{business._count?.subscriptions || 0}</span> subs,{' '}
                      <span className="font-medium">{business._count?.customers || 0}</span> customers
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(business)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                      >
                        Edit
                      </button>
                      {business.slug !== 'default' && (
                        <button
                          onClick={() => setDeleteConfirm({
                            id: business.id,
                            name: business.name,
                            counts: {
                              orders: business._count?.orders || 0,
                              subscriptions: business._count?.subscriptions || 0,
                              customers: business._count?.customers || 0
                            }
                          })}
                          className="text-red-600 hover:text-red-900 font-medium text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* DNS Verification Result Modal */}
      {dnsResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setDnsResult(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">DNS Verification</h3>
              <button onClick={() => setDnsResult(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {dnsResult.configured ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-green-800">DNS Configured Correctly</p>
                  <p className="text-sm text-green-600">
                    {dnsResult.domain} → {dnsResult.actual}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg mb-4">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-red-800">DNS Not Configured</p>
                    {dnsResult.actual && (
                      <p className="text-sm text-red-600">
                        Found: {dnsResult.actual} (expected: {dnsResult.expected})
                      </p>
                    )}
                  </div>
                </div>
                
                {dnsResult.instructions && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-2">Setup Instructions</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                      {dnsResult.instructions.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setDnsResult(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Delete Business</h3>
              <button onClick={() => !deleting && setDeleteConfirm(null)} className="text-slate-400 hover:text-slate-600" disabled={deleting}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-slate-600 mb-2">
                You are about to delete <strong>{deleteConfirm.name}</strong>.
              </p>
              <p className="text-sm text-slate-500 mb-4">
                This will permanently delete:
              </p>
              <ul className="text-sm text-slate-600 space-y-1 mb-4">
                <li>• {deleteConfirm.counts.orders} orders</li>
                <li>• {deleteConfirm.counts.subscriptions} subscriptions</li>
                <li>• {deleteConfirm.counts.customers} customers</li>
              </ul>
              <p className="text-sm text-red-600 font-medium">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="DELETE"
                disabled={deleting}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || deleteInput !== 'DELETE'}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Business'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}