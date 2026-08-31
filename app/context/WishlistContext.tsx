// app/context/WishlistContext.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'

export interface WishlistItem {
  id: string
  name: string
  price: number
  image_url?: string
  category?: string
  stock?: number
}

interface WishlistContextType {
  wishlist: WishlistItem[]
  addToWishlist: (product: any) => void
  removeFromWishlist: (id: string) => void
  isInWishlist: (id: string) => boolean
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const supabase = createClient()

  useEffect(() => {
    const savedWishlist = localStorage.getItem('mahins_wishlist')
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist))
      } catch (e) {
        console.error("Failed to parse wishlist", e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('mahins_wishlist', JSON.stringify(wishlist))
  }, [wishlist])

  const addToWishlist = (product: any) => {
    setWishlist((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev
      return [...prev, {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price ?? 0),
        image_url: product.image_url || '',
        category: product.category || 'Uncategorized',
        stock: product.stock ?? 0
      }]
    })
  }

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id))
  }

  const isInWishlist = (id: string) => {
    return wishlist.some((item) => item.id === id)
  }

  const clearWishlist = () => setWishlist([])

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider')
  return context
}