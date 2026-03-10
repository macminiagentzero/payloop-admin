import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SyncButton from './SyncButton'

interface Props {
  params: Promise<{ id: string }>
}

interface StoreResult {
  id: string
  name: string
  domain: string
  isActive: boolean
  lastSyncAt: Date | null
  productCount: number
  createdAt: Date
}

interface ProductResult {
  id: string
  shopifyId: string
  title: string
  handle: string | null
  status: string
  image: string | null
  price: number | null
  syncedAt: Date | null
}

export default async function StoreDetailPage({ params }: Props) {
  const { id } = await params

  // Get store details - cast UUID properly
  const stores = await prisma.$queryRaw<StoreResult[]>`
    SELECT id, name, domain, "isActive", "lastSyncAt", "productCount", "createdAt"
    FROM "ShopifyStore"
    WHERE id = ${id}::uuid
  `

  if (stores.length === 0) {
    notFound()
  }

  const store = stores[0]

  // Get products for this store - cast UUID properly
  const products = await prisma.$queryRaw<ProductResult[]>`
    SELECT id, "shopifyId", title, handle, status, image, price, "syncedAt"
    FROM "ShopifyProduct"
    WHERE "storeId" = ${id}::uuid
    ORDER BY "syncedAt" DESC NULLS LAST, "createdAt" DESC
  `

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/stores"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Stores
      </Link>

      {/* Store Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{store.name}</h1>
              <p className="text-slate-500">{store.domain}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {store.isActive ? (
              <span className="inline-flex px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-full">
                Active
              </span>
            ) : (
              <span className="inline-flex px-3 py-1 text-sm font-medium bg-slate-100 text-slate-600 rounded-full">
                Inactive
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-200">
          <div>
            <div className="text-sm text-slate-500">Products</div>
            <div className="text-2xl font-bold text-slate-900">{store.productCount || 0}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Last Sync</div>
            <div className="text-2xl font-bold text-slate-900">
              {store.lastSyncAt ? new Date(store.lastSyncAt).toLocaleDateString() : 'Never'}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Connected</div>
            <div className="text-2xl font-bold text-slate-900">
              {new Date(store.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Sync Button */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <SyncButton storeId={store.id} storeDomain={store.domain} />
        </div>
      </div>

      {/* Products */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Products</h2>
          <span className="text-sm text-slate-500">{products.length} products</span>
        </div>

        {products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m8-4l-8-4m0 0L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-slate-500">No products synced yet</p>
            <p className="text-sm text-slate-400 mt-1">Click "Sync Products" to fetch products from Shopify</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Synced
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img src={product.image} alt={product.title} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m8-4l-8-4m0 0L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-slate-900">{product.title}</div>
                          {product.handle && (
                            <div className="text-xs text-slate-500 font-mono">{product.handle}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {product.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {product.price ? `$${product.price.toFixed(2)}` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {product.syncedAt ? new Date(product.syncedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}