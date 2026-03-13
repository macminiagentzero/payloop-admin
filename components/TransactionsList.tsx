'use client'

import { useEffect, useState } from 'react'
import { fmt } from '@/lib/format'

interface Transaction {
  id: string
  subscriptionId: string
  orderId: string | null
  amount: number
  status: string
  type: string
  description: string | null
  transactionId: string | null
  createdAt: string
}

interface Props {
  orderId: string
}

export default function TransactionsList({ orderId }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch(`/api/orders/${orderId}/transactions`)
        const data = await res.json()
        
        if (data.success) {
          setTransactions(data.transactions)
        } else {
          setError(data.error || 'Failed to load transactions')
        }
      } catch (e) {
        setError('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTransactions()
  }, [orderId])

  if (loading) {
    return (
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">Transactions</h2>
        </div>
        <div className="p-8 text-center text-slate-500">
          Loading transactions...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">Transactions</h2>
        </div>
        <div className="p-8 text-center text-red-500">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Transactions</h2>
        <span className="text-sm text-slate-500">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</span>
      </div>
      {transactions.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.status === 'approved' 
                    ? 'bg-emerald-100' 
                    : tx.status === 'declined'
                    ? 'bg-red-100'
                    : 'bg-amber-100'
                }`}>
                  {tx.status === 'approved' ? (
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : tx.status === 'declined' ? (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{fmt(tx.amount)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.type === 'initial' 
                        ? 'bg-blue-100 text-blue-700' 
                        : tx.type === 'rebill'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {tx.type}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">
                    {tx.description || `Transaction #${tx.id.slice(0, 8)}`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-900">
                  {new Date(tx.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                {tx.transactionId && (
                  <div className="text-xs text-slate-400 font-mono">
                    TX: {tx.transactionId}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-slate-500 mb-2">No transactions yet</p>
          <p className="text-sm text-slate-400">
            Click "Charge Now" on a subscription to create a transaction
          </p>
        </div>
      )}
    </div>
  )
}