// app/components/MobileBottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '../context/CartContext'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { cart } = useCart()
  const totalItems = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)

  // Hide on admin routes
  if (pathname.startsWith('/admin')) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block sm:hidden bg-[#F4EADE]/95 backdrop-blur-md border-t border-[#8A7968]/30 shadow-lg">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {/* Storefront */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-bold transition ${
            pathname === '/' ? 'text-[#B76E79]' : 'text-[#8A7968] hover:text-[#2B2B2B]'
          }`}
        >
          <span className="text-lg">🏪</span>
          <span>Store</span>
        </Link>

        {/* Live Order Tracking */}
        <Link
          href="/track"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-bold transition ${
            pathname.startsWith('/track') ? 'text-[#B76E79]' : 'text-[#8A7968] hover:text-[#2B2B2B]'
          }`}
        >
          <span className="text-lg">📍</span>
          <span>Track</span>
        </Link>

        {/* Cart with Item Counter Badge */}
        <Link
          href="/cart"
          className={`relative flex flex-col items-center justify-center flex-1 py-1 text-xs font-bold transition ${
            pathname === '/cart' ? 'text-[#B76E79]' : 'text-[#8A7968] hover:text-[#2B2B2B]'
          }`}
        >
          <div className="relative">
            <span className="text-lg">🛒</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-2.5 bg-[#B76E79] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                {totalItems}
              </span>
            )}
          </div>
          <span>Cart</span>
        </Link>

        {/* Direct WhatsApp Support */}
        <a
          href="https://wa.me/919989945139?text=Hi%20Mahin%2C%20I%20have%20an%20inquiry%20regarding%20products."
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-bold text-green-700 hover:text-green-800 transition"
        >
          <span className="text-lg">💬</span>
          <span>Chat</span>
        </a>
      </div>
    </nav>
  )
}