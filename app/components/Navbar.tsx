// app/components/Navbar.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { totalItems } = useCart()
  const { wishlist } = useWishlist()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }

    fetchUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  // Hide the storefront header on admin routes
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <header className="bg-[#EFE3D3] px-3 sm:px-8 lg:px-12 py-3.5 sm:py-5 shadow-xs sticky top-0 z-50 w-full border-b border-[#8A7968]/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link href="/" className="hover:opacity-90 transition cursor-pointer min-w-0 shrink">
          <h1 className="text-sm sm:text-xl md:text-2xl font-black text-[#2B2B2B] tracking-tight truncate">
            Mahin's One-Stop One-Store
          </h1>
        </Link>

        {/* Global Action Navigation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* School PO Portal Link */}
          <Link
            href="/school-po"
            className="flex items-center gap-1.5 rounded-xl bg-[#B76E79] px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-black text-white hover:bg-[#9E5B65] transition shadow-xs"
          >
            🏛️ <span className="hidden sm:inline">School PO Portal</span>
          </Link>

          {/* Order Tracking */}
          <Link
            href="/track"
            className="hidden md:flex items-center gap-1.5 rounded-xl bg-[#F4EADE] px-3.5 py-2 text-xs font-bold text-[#2B2B2B] hover:bg-[#EADBC8] transition border border-[#8A7968]/30"
          >
            📦 Track Order
          </Link>

          {/* Wishlist Pill */}
          <Link
            href="/wishlist"
            className="relative flex items-center gap-1 rounded-xl bg-[#B76E79]/15 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-[#B76E79] hover:bg-[#B76E79]/25 transition border border-[#B76E79]/40"
          >
            <span>★</span>
            <span className="hidden sm:inline">Wishlist</span>
            {wishlist?.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#B76E79] text-[10px] text-white font-bold">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart Pill */}
          <Link
            href="/cart"
            className="flex relative items-center gap-1.5 rounded-xl bg-[#F4EADE] px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[#2B2B2B] text-xs sm:text-sm font-semibold hover:bg-[#EADBC8] transition border border-[#8A7968]/30"
          >
            <span>🛒</span>
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[#B76E79] text-[10px] sm:text-xs text-white font-bold">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Auth Controls */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-3 border-l pl-2 sm:pl-4 border-[#8A7968]/30">
              <Link
                href="/orders"
                className="rounded-xl bg-[#F4EADE] px-2.5 py-1.5 text-xs font-bold text-[#2B2B2B] transition hover:bg-[#EADBC8] border border-[#8A7968]/30 flex items-center gap-1"
              >
                <span>📋</span>
                <span className="hidden md:inline">Orders</span>
              </Link>

              <Link
                href="/profile"
                className="rounded-xl bg-[#F4EADE] px-2.5 py-1.5 text-xs font-bold text-[#2B2B2B] transition hover:bg-[#EADBC8] border border-[#8A7968]/30"
              >
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-xl bg-[#EADBC8] px-2.5 py-1.5 text-xs font-bold text-[#2B2B2B] transition hover:bg-[#8A7968]/30 cursor-pointer hidden sm:inline-block border border-[#8A7968]/30"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3 border-l pl-2 sm:pl-4 border-[#8A7968]/30 text-xs font-bold text-[#B76E79]">
              <Link href="/login" className="hover:underline py-1">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}