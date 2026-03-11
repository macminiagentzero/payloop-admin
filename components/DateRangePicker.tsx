'use client'

import { useState, useRef, useEffect } from 'react'

interface DateRangePickerProps {
  value: string
  onChange: (value: string, startDate?: string, endDate?: string) => void
  customStartDate?: string
  customEndDate?: string
}

export default function DateRangePicker({ value, onChange, customStartDate, customEndDate }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [tempStartDate, setTempStartDate] = useState(customStartDate || '')
  const [tempEndDate, setTempEndDate] = useState(customEndDate || '')
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const options = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: '7days', label: 'Last 7 days' },
    { value: '30days', label: 'Last 30 days' },
    { value: 'thisMonth', label: 'This month' },
    { value: 'lastMonth', label: 'Last month' },
    { value: 'all', label: 'All time' },
  ]
  
  const selectedOption = options.find(o => o.value === value)
  
  // Format date for display
  const formatDateDisplay = (start: string, end: string) => {
    if (!start || !end) return 'Custom range'
    const startDate = new Date(start)
    const endDate = new Date(end)
    const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${format(startDate)} - ${format(endDate)}`
  }
  
  // Get label to display
  const displayLabel = selectedOption?.label || (customStartDate && customEndDate ? formatDateDisplay(customStartDate, customEndDate) : 'Last 7 days')
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowCustom(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handlePresetSelect = (preset: string) => {
    onChange(preset)
    setIsOpen(false)
    setShowCustom(false)
  }
  
  const handleCustomApply = () => {
    if (tempStartDate && tempEndDate) {
      onChange('custom', tempStartDate, tempEndDate)
      setIsOpen(false)
      setShowCustom(false)
    }
  }
  
  // Set temp dates when custom dates change externally
  useEffect(() => {
    if (customStartDate) setTempStartDate(customStartDate)
    if (customEndDate) setTempEndDate(customEndDate)
  }, [customStartDate, customEndDate])
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-medium text-slate-700">{displayLabel}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 w-56">
          {!showCustom ? (
            <>
              {options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handlePresetSelect(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                    value === option.value ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <div className="border-t border-slate-200 my-1" />
              <button
                onClick={() => setShowCustom(true)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  value === 'custom' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700'
                }`}
              >
                📅 Custom range...
              </button>
            </>
          ) : (
            <div className="p-3">
              <div className="text-xs font-medium text-slate-500 mb-2">Select date range</div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Start date</label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">End date</label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowCustom(false)}
                    className="flex-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded border border-slate-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCustomApply}
                    disabled={!tempStartDate || !tempEndDate}
                    className="flex-1 px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}