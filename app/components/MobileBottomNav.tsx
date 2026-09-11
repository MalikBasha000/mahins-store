// app/components/MobileBottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { cart } = useCart()
  const { wishlist } = useWishlist()
  
  const totalCartItems = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
  const totalWishlistItems = wishlist?.length || 0

  // Hide on admin routes
  if (pathname.startsWith('/admin')) {
    return null
  }

  const navItems = [
    {
      label: 'Store',
      href: '/',
      icon: '🏪',
      badge: 0,
      isActive: pathname === '/',
    },
    {
      label: 'Wishlist',
      href: '/wishlist',
      icon: '★',
      badge: totalWishlistItems,
      isActive: pathname === '/wishlist',
    },
    {
      label: 'Cart',
      href: '/cart',
      icon: '🛒',
      badge: totalCartItems,
      isActive: pathname === '/cart',
    },
    {
      label: 'Orders',
      href: '/orders',
      icon: '📋',
      badge: 0,
      isActive: pathname.startsWith('/orders'),
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: '👤',
      badge: 0,
      isActive: pathname.startsWith('/profile'),
    },
  ]

  return (
    <nav className="fixed bottom-2.5 inset-x-2.5 z-40 block sm:hidden bg-[#EFE3D3]/95 backdrop-blur-md border border-[#8A7968]/30 rounded-2xl shadow-lg shadow-[#2B2B2B]/10">
      <div className="flex items-center justify-around h-15 max-w-md mx-auto px-1.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-150 ${
              item.isActive
                ? 'text-[#B76E79] font-black scale-105'
                : 'text-[#8A7968] hover:text-[#2B2B2B] font-semibold'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <span className="text-base leading-none">{item.icon}</span>

              {item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#B76E79] text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>

            <span className="text-[10px] tracking-tight mt-1 leading-none">
              {item.label}
            </span>

            {item.isActive && (
              <span className="absolute -bottom-1 h-0.5 w-3.5 rounded-full bg-[#B76E79]" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}