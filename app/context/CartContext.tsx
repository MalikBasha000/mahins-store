// app/context/CartContext.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: any, quantityToAdd?: number) => void
  updateQuantity: (id: string, newQuantity: number) => void
  removeFromCart: (id: string) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    const savedCart = localStorage.getItem('mahins_cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error("Failed to parse cart", e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('mahins_cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product: any, quantityToAdd: number = 1) => {
    // Correctly resolve price from either product.price or product.base_price
    const itemPrice = parseFloat(product.price ?? product.base_price ?? 0)

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id)
      if (existingIndex > -1) {
        const updated = [...prevCart]
        updated[existingIndex].quantity += quantityToAdd
        return updated
      } else {
        return [...prevCart, { 
          id: product.id, 
          name: product.name, 
          price: itemPrice, 
          quantity: quantityToAdd,
          image_url: product.image_url || ''
        }]
      }
    })
    alert(`${quantityToAdd} ${product.name}(s) added to cart!`)
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return 
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  const clearCart = () => setCart([])

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

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