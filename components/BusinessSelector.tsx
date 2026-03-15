'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Business {
  id: string
  name: string
  slug: string
}

export default function BusinessSelector() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Fetch businesses
    fetch('/api/businesses')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBusinesses(data)
          // Get current business from cookie
          const savedId = document.cookie
            .split('; ')
            .find(row => row.startsWith('businessId='))
            ?.split('=')[1]
          
          if (savedId) {
            const saved = data.find((b: Business) => b.id === savedId)
            if (saved) {
              setCurrentBusiness(saved)
              return
            }
          }
          
          // Default to first business
          if (data.length > 0) {
            setCurrentBusiness(data[0])
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const switchBusiness = async (business: Business) => {
    // Save to cookie
    document.cookie = `businessId=${business.id}; path=/; max-age=31536000`
    setCurrentBusiness(business)
    setIsOpen(false)
    
    // Refresh the page to apply the new business context
    router.refresh()
  }

  if (loading) {
    return (
      <div className="h-9 w-32 animate-pulse bg-slate-200 rounded-lg" />
    )
  }

  if (businesses.length === 0) {
    return null
  }

  if (businesses.length === 1) {
    // Single business - just show the name
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-sm font-medium text-slate-700">
          {currentBusiness?.name || 'Business'}
        </span>
      </div>
    )
  }

  // Multiple businesses - show dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-sm font-medium text-slate-700">
          {currentBusiness?.name || 'Select Business'}
        </span>
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {businesses.map(business => (
              <button
                key={business.id}
                onClick={() => switchBusiness(business)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  currentBusiness?.id === business.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                }`}
              >
                <div className="font-medium">{business.name}</div>
                <div className="text-xs text-slate-500">{business.slug}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}