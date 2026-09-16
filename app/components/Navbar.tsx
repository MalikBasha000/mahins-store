// app/components/Navbar.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useSchoolPOCart } from '../context/SchoolPOCartContext'
import Logo from './Logo'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { totalItems } = useCart()
  const { wishlist } = useWishlist()
  const { poTotalItems, schoolUser, logoutSchool } = useSchoolPOCart()

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

  // If we are on ANY School PO page, show the dedicated School PO Navbar
  const isSchoolPOPage = pathname?.startsWith('/school-po')

  if (isSchoolPOPage) {
    return (
      <header className="bg-[#EFE3D3] px-3 sm:px-8 lg:px-12 py-3.5 sm:py-4 shadow-xs sticky top-0 z-50 w-full border-b border-[#8A7968]/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          {/* School Portal Brand Logo with Custom Vector Component */}
          <Link href="/school-po" className="hover:opacity-90 transition cursor-pointer min-w-0 shrink">
            <div className="flex items-center gap-2.5">
              <Logo size={36} variant="icon" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-lg md:text-xl font-black text-[#2B2B2B] tracking-tight truncate">
                    Mahin's School PO Portal
                  </h1>
                  <span className="hidden sm:inline-block text-[9px] bg-[#B76E79] text-white px-2 py-0.5 rounded-full font-bold uppercase">
                    ATL Portal
                  </span>
                </div>
                <span className="text-[10px] text-[#8A7968] font-bold block -mt-0.5">
                  Institutional Sales & ATL Lab Portal
                </span>
              </div>
            </div>
          </Link>

          {/* School Action Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* School PO Catalog */}
            <Link
              href="/school-po"
              className="hidden md:flex items-center gap-1 rounded-xl bg-[#F4EADE] px-3 py-1.5 text-xs font-bold text-[#2B2B2B] hover:bg-[#EADBC8] transition border border-[#8A7968]/30"
            >
              📦 Catalog
            </Link>

            {/* School PO Tracking */}
            <Link
              href="/school-po/track"
              className="hidden sm:flex items-center gap-1 rounded-xl bg-[#F4EADE] px-3 py-1.5 text-xs font-bold text-[#2B2B2B] hover:bg-[#EADBC8] transition border border-[#8A7968]/30"
            >
              🚚 Track PO
            </Link>

            {/* School PO Orders */}
            <Link
              href="/school-po/orders"
              className="flex items-center gap-1 rounded-xl bg-[#F4EADE] px-2.5 py-1.5 text-xs font-bold text-[#2B2B2B] hover:bg-[#EADBC8] transition border border-[#8A7968]/30"
            >
              📋 <span className="hidden sm:inline">PO Orders</span>
            </Link>

            {/* School PO Dedicated Cart */}
            <Link
              href="/school-po/cart"
              className="flex relative items-center gap-1.5 rounded-xl bg-[#B76E79] hover:bg-[#9E5B65] text-white px-3 py-1.5 text-xs font-bold transition shadow-xs"
            >
              <span>🛒</span>
              <span>PO Cart</span>
              {poTotalItems > 0 && (
                <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-white text-[#B76E79] text-[10px] sm:text-xs font-black">
                  {poTotalItems}
                </span>
              )}
            </Link>

            {/* School User Auth */}
            {schoolUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2 border-l pl-2 sm:pl-3 border-[#8A7968]/30">
                <span className="hidden lg:inline-block text-[11px] font-bold text-green-800 bg-green-100 border border-green-200 px-2 py-0.5 rounded-lg truncate max-w-[150px]" title={schoolUser.school_name}>
                  ✓ {schoolUser.school_name}
                </span>
                <button
                  onClick={() => {
                    logoutSchool()
                    router.push('/school-po/auth')
                  }}
                  className="rounded-xl bg-[#EADBC8] hover:bg-[#8A7968]/30 px-2.5 py-1.5 text-xs font-bold text-[#2B2B2B] transition border border-[#8A7968]/30 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/school-po/auth"
                className="rounded-xl bg-[#EADBC8] hover:bg-[#8A7968]/30 px-3 py-1.5 text-xs font-bold text-[#2B2B2B] transition border border-[#8A7968]/30"
              >
                School Login
              </Link>
            )}
          </div>
        </div>
      </header>
    )
  }

  // Default Storefront Header for Main Store
  return (
    <header className="bg-[#EFE3D3] px-3 sm:px-8 lg:px-12 py-3 sm:py-4 shadow-xs sticky top-0 z-50 w-full border-b border-[#8A7968]/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
        {/* Main Store Brand Logo */}
        <Link href="/" className="hover:opacity-95 transition cursor-pointer min-w-0 shrink">
          <Logo size={42} variant="full" />
        </Link>

        {/* Global Action Navigation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* School PO Portal Link: OPENS IN A NEW TAB */}
          <Link
            href="/school-po"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-[#B76E79] px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-black text-white hover:bg-[#9E5B65] transition shadow-xs"
            title="Opens School PO Portal in a new tab"
          >
            <span>🏛️</span>
            <span className="hidden sm:inline">School PO Portal ↗</span>
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