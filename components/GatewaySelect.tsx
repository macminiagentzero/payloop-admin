'use client'

import { useRouter } from 'next/navigation'

interface GatewaySelectProps {
  productId: string
  gatewayId: string | null
  gateways: Array<{
    id: string
    name: string
    displayName: string | null
    isDefault: boolean
  }>
}

export function GatewaySelect({ productId, gatewayId, gateways }: GatewaySelectProps) {
  const router = useRouter()
  
  async function handleChange(newGatewayId: string) {
    await fetch(`/api/subscription-products/${productId}/gateway`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gatewayId: newGatewayId || null })
    })
    router.refresh()
  }
  
  return (
    <select
      defaultValue={gatewayId || ''}
      onChange={(e) => handleChange(e.target.value)}
      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
    >
      <option value="">Not assigned</option>
      {gateways.map(gw => (
        <option key={gw.id} value={gw.id}>
          {gw.displayName || gw.name} {gw.isDefault ? '(Default)' : ''}
        </option>
      ))}
    </select>
  )
}