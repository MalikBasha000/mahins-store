// app/context/SchoolPOCartContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface SchoolAccount {
  id: string
  school_name: string
  educator_name: string
  email: string
  phone: string
  udise_code: string
  atl_code?: string
  address: string
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string
  stock?: number
}

interface SchoolPOCartContextType {
  schoolUser: SchoolAccount | null
  setSchoolUser: (user: SchoolAccount | null) => void
  poCart: CartItem[]
  addToPOCart: (product: any, quantity?: number) => void
  updatePOQuantity: (id: string, quantity: number) => void
  removeFromPOCart: (id: string) => void
  clearPOCart: () => void
  poTotalItems: number
  poTotalPrice: number
  logoutSchool: () => void
}

const SchoolPOCartContext = createContext<SchoolPOCartContextType | undefined>(undefined)

export function SchoolPOCartProvider({ children }: { children: React.ReactNode }) {
  const [schoolUser, setSchoolUserState] = useState<SchoolAccount | null>(null)
  const [poCart, setPoCart] = useState<CartItem[]>([])

  useEffect(() => {
    const savedUser = localStorage.getItem('school_po_user')
    const savedCart = localStorage.getItem('school_po_cart')
    if (savedUser) setSchoolUserState(JSON.parse(savedUser))
    if (savedCart) setPoCart(JSON.parse(savedCart))
  }, [])

  const setSchoolUser = (user: SchoolAccount | null) => {
    setSchoolUserState(user)
    if (user) {
      localStorage.setItem('school_po_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('school_po_user')
    }
  }

  const logoutSchool = () => {
    setSchoolUser(null)
    setPoCart([])
    localStorage.removeItem('school_po_user')
    localStorage.removeItem('school_po_cart')
  }

  const saveCart = (items: CartItem[]) => {
    setPoCart(items)
    localStorage.setItem('school_po_cart', JSON.stringify(items))
  }

  const addToPOCart = (product: any, quantity = 1) => {
    const existing = poCart.find((i) => i.id === product.id)
    if (existing) {
      saveCart(
        poCart.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        )
      )
    } else {
      saveCart([
        ...poCart,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          quantity,
          image_url: product.image_url,
          stock: product.stock
        }
      ])
    }
  }

  const updatePOQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromPOCart(id)
      return
    }
    saveCart(poCart.map((i) => (i.id === id ? { ...i, quantity } : i)))
  }

  const removeFromPOCart = (id: string) => {
    saveCart(poCart.filter((i) => i.id !== id))
  }

  const clearPOCart = () => {
    saveCart([])
  }

  const poTotalItems = poCart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
  const poTotalPrice = poCart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  )

  return (
    <SchoolPOCartContext.Provider
      value={{
        schoolUser,
        setSchoolUser,
        poCart,
        addToPOCart,
        updatePOQuantity,
        removeFromPOCart,
        clearPOCart,
        poTotalItems,
        poTotalPrice,
        logoutSchool
      }}
    >
      {children}
    </SchoolPOCartContext.Provider>
  )
}

export function useSchoolPOCart() {
  const context = useContext(SchoolPOCartContext)
  if (!context) {
    throw new Error('useSchoolPOCart must be used within a SchoolPOCartProvider')
  }
  return context
}