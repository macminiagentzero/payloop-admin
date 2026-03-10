import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GatewayConfigPage({ params }: Props) {
  const { id } = await params
  
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
          <h1 className="text-2xl font-bold text-slate-900">Configure Gateway</h1>
          <p className="text-slate-500 mt-1">Gateway ID: {id}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <p className="text-slate-600">Gateway configuration page is loading...</p>
        <p className="text-sm text-slate-400 mt-2">ID: {id}</p>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/gateways"
          className="px-6 py-2 text-slate-600 hover:text-slate-800"
        >
          Cancel
        </Link>
      </div>
    </div>
  )
}