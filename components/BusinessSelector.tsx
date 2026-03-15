'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Business {
  id: string
  name: string
  slug: string
  primaryColor?: string | null
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
    
    // Full page reload to apply the new business context
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse" />
        <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
      </div>
    )
  }

  if (businesses.length === 0) {
    return null
  }

  if (businesses.length === 1) {
    // Single business - show a nice pill
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
          style={{ backgroundColor: currentBusiness?.primaryColor || '#4F46E5' }}
        >
          {currentBusiness?.name?.charAt(0).toUpperCase() || 'B'}
        </div>
        <span className="text-sm font-medium text-slate-800">
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
        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-slate-50 transition-all shadow-sm"
      >
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
          style={{ backgroundColor: currentBusiness?.primaryColor || '#4F46E5' }}
        >
          {currentBusiness?.name?.charAt(0).toUpperCase() || 'B'}
        </div>
        <span className="text-sm font-medium text-slate-800">
          {currentBusiness?.name || 'Select Business'}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Switch Business</p>
            </div>
            <div className="py-1 max-h-64 overflow-y-auto">
              {businesses.map(business => (
                <button
                  key={business.id}
                  onClick={() => switchBusiness(business)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                    currentBusiness?.id === business.id 
                      ? 'bg-indigo-50' 
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ backgroundColor: business.primaryColor || '#4F46E5' }}
                  >
                    {business.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${currentBusiness?.id === business.id ? 'text-indigo-700' : 'text-slate-800'}`}>
                      {business.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{business.slug}</div>
                  </div>
                  {currentBusiness?.id === business.id && (
                    <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
              <a
                href="/businesses"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage Businesses
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}