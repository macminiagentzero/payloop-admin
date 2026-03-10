'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteProductButtonProps {
  productId: string
}

export function DeleteProductButton({ productId }: DeleteProductButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/subscription-products/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/subscription-products')
        router.refresh()
      } else {
        alert('Failed to delete product')
        setIsDeleting(false)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
      setIsDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
    >
      {isDeleting ? 'Deleting...' : 'Delete Product'}
    </button>
  )
}