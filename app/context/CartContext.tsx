// app/context/CartContext.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'

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
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null)
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

  // Automatically dismiss the toast notification after 3.5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  const addToCart = (product: any, quantityToAdd: number = 1) => {
    const itemPrice = parseFloat(product.price ?? product.base_price ?? 0)
    const maxStock = product.stock ?? 999
    const qty = Number(quantityToAdd) || 1

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id)
      if (existingIndex > -1) {
        const updated = [...prevCart]
        const currentQty = Number(updated[existingIndex].quantity) || 1
        const newQty = Math.min(maxStock, currentQty + qty)
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
          quantity: Math.min(maxStock, qty),
          image_url: product.image_url || '',
          stock: maxStock
        }]
      }
    })

    // Display custom professional toast notification
    setToastMessage({
      title: 'Added to Cart',
      desc: `${qty}× ${product.name}`,
    })
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

      {/* Professional Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[999999] max-w-sm w-[calc(100%-2rem)] transition-all duration-300 transform translate-y-0">
          <div className="bg-[#EFE3D3] border border-[#8A7968]/30 shadow-2xl rounded-2xl p-3.5 flex items-center gap-3 text-[#2B2B2B]">
            <div className="w-9 h-9 rounded-xl bg-[#B76E79] text-white flex items-center justify-center shrink-0 font-bold shadow-xs text-sm">
              ✓
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#B76E79] leading-none">
                {toastMessage.title}
              </h4>
              <p className="text-xs font-bold text-[#2B2B2B] truncate mt-1">
                {toastMessage.desc}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href="/cart"
                onClick={() => setToastMessage(null)}
                className="text-[11px] font-extrabold bg-[#B76E79] hover:bg-[#9E5B65] text-white px-3 py-1.5 rounded-lg transition shadow-xs whitespace-nowrap btn-press"
              >
                View Cart
              </Link>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-[#8A7968] hover:text-[#2B2B2B] text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}