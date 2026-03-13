// Currency formatter
export const fmt = (n: number) => new Intl.NumberFormat('en-US', { 
  style: 'currency', 
  currency: 'USD' 
}).format(n)

// Date formatter
export const formatDate = (d: Date | string) => new Date(d).toLocaleDateString('en-US', { 
  month: 'short', 
  day: 'numeric', 
  year: 'numeric' 
})

// Time formatter
export const formatTime = (d: Date | string) => new Date(d).toLocaleTimeString('en-US', { 
  hour: '2-digit', 
  minute: '2-digit' 
})