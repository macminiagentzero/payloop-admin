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
      <div className="px-3 py-2">
        <div className="h-4 w-24 bg-slate-600 rounded animate-pulse" />
      </div>
    )
  }

  if (businesses.length === 0) {
    return null
  }

  // Single business - show as nav item
  if (businesses.length === 1) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 text-slate-300">
          <div 
            className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
            style={{ backgroundColor: currentBusiness?.primaryColor || '#4F46E5' }}
          >
            {currentBusiness?.name?.charAt(0).toUpperCase() || 'B'}
          </div>
          <span className="text-sm font-medium truncate">{currentBusiness?.name}</span>
        </div>
      </div>
    )
  }

  // Multiple businesses - dropdown
  return (
    <div className="px-3 py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
      >
        <div 
          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
          style={{ backgroundColor: currentBusiness?.primaryColor || '#4F46E5' }}
        >
          {currentBusiness?.name?.charAt(0).toUpperCase() || 'B'}
        </div>
        <span className="text-sm font-medium truncate flex-1 text-left">
          {currentBusiness?.name}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-700">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Switch Business</p>
            </div>
            <div className="py-1 max-h-64 overflow-y-auto">
              {businesses.map(business => (
                <button
                  key={business.id}
                  onClick={() => switchBusiness(business)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                    currentBusiness?.id === business.id 
                      ? 'bg-indigo-600/20 text-white' 
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <div 
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: business.primaryColor || '#4F46E5' }}
                  >
                    {business.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium truncate">{business.name}</span>
                  {currentBusiness?.id === business.id && (
                    <svg className="w-4 h-4 text-indigo-400 flex-shrink-0 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-slate-700">
              <a
                href="/businesses"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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