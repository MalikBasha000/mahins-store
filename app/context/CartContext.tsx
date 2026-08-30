// app/context/CartContext.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number | string
  image_url?: string
  stock?: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: any, quantityToAdd?: number) => void
  updateQuantity: (id: string, newQuantity: number | string) => void
  removeFromCart: (id: string) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchLatestPricesAndCart = async () => {
      const savedCart = localStorage.getItem('mahins_cart')
      if (savedCart) {
        try {
          const parsedCart: CartItem[] = JSON.parse(savedCart)
          
          // Fetch latest price and stock from Supabase to ensure dynamic updates
          const productIds = parsedCart.map(item => item.id)
          if (productIds.length > 0) {
            const { data: latestProducts } = await supabase
              .from('products')
              .select('id, price, stock, name, image_url')
              .in('id', productIds)

            if (latestProducts) {
              const updatedCart = parsedCart.map(item => {
                const fresh = latestProducts.find(p => p.id === item.id)
                if (fresh) {
                  return {
                    ...item,
                    price: parseFloat(fresh.price ?? item.price),
                    stock: fresh.stock ?? item.stock,
                    name: fresh.name ?? item.name,
                    image_url: fresh.image_url ?? item.image_url
                  }
                }
                return item
              })
              setCart(updatedCart)
              return
            }
          }
          setCart(parsedCart)
        } catch (e) {
          console.error("Failed to parse cart", e)
        }
      }
    }

    fetchLatestPricesAndCart()
  }, [supabase])

  useEffect(() => {
    localStorage.setItem('mahins_cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product: any, quantityToAdd: number = 1) => {
    const itemPrice = parseFloat(product.price ?? product.base_price ?? 0)
    const maxStock = product.stock ?? 999

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id)
      if (existingIndex > -1) {
        const updated = [...prevCart]
        const currentQty = Number(updated[existingIndex].quantity) || 1
        const newQty = Math.min(maxStock, currentQty + quantityToAdd)
        updated[existingIndex] = {
          ...updated[existingIndex],
          price: itemPrice, // Update to dynamic price
          quantity: newQty,
          stock: maxStock
        }
        return updated
      } else {
        return [...prevCart, { 
          id: product.id, 
          name: product.name, 
          price: itemPrice, 
          quantity: Math.min(maxStock, quantityToAdd),
          image_url: product.image_url || '',
          stock: maxStock
        }]
      }
    })
    alert(`${quantityToAdd} ${product.name}(s) added to cart!`)
  }

  const updateQuantity = (id: string, newQuantity: number | string) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === id) {
          // Allow empty string while typing
          if (newQuantity === '') {
            return { ...item, quantity: '' }
          }
          const parsed = typeof newQuantity === 'string' ? parseInt(newQuantity, 10) : newQuantity
          if (isNaN(parsed)) return item

          const maxStock = item.stock ?? 999
          const clampedQty = Math.max(1, Math.min(maxStock, parsed))
          return { ...item, quantity: clampedQty }
        }
        return item
      })
    )
  }

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  const clearCart = () => setCart([])

  const totalItems = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * (Number(item.quantity) || 0)), 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}