import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import GatewayForm from './GatewayForm'

interface Props {
  params: Promise<{ id: string }>
}

async function getGateway(id: string) {
  try {
    const gateway = await prisma.paymentGateway.findUnique({
      where: { id }
    })
    return gateway
  } catch {
    return null
  }
}

export default async function GatewayConfigPage({ params }: Props) {
  const { id } = await params
  const gateway = await getGateway(id)
  
  if (!gateway) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/gateways"
          className="text-slate-500 hover:text-slate-700"
        >
          ← Back to Gateways
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{gateway.displayName}</h1>
          <p className="text-slate-500 mt-1">{gateway.type.toUpperCase()} Gateway Configuration</p>
        </div>
        <div className="flex items-center gap-2">
          {gateway.isActive ? (
            <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
              Active
            </span>
          ) : (
            <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-slate-100 text-slate-600">
              Inactive
            </span>
          )}
          {gateway.isDefault && (
            <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-700">
              Default
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Gateway Settings</h2>
        </div>
        
        <GatewayForm gateway={gateway} />
      </div>

      <div className="px-6">
        <Link
          href="/gateways"
          className="text-slate-600 hover:text-slate-800"
        >
          Cancel
        </Link>
      </div>
    </div>
  )
}