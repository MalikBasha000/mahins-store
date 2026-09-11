// app/wishlist/page.tsx
'use client'

import { useEffect } from 'react'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist()
  const { addToCart } = useCart()
  const supabase = createClient()

  useEffect(() => {
    const syncWishlistPrices = async () => {
      if (wishlist.length === 0) return
      const ids = wishlist.map((item) => item.id)
      await supabase
        .from('products')
        .select('id, name, price, image_url, category, stock')
        .in('id', ids)
    }
    syncWishlistPrices()
  }, [supabase, wishlist])

  return (
    <div className="min-h-screen bg-[#F4EADE] pb-24 sm:pb-16 w-full overflow-x-hidden text-[#2B2B2B]">
      {/* Header */}
      <header className="bg-white border-b border-[#8A7968]/20 px-4 sm:px-6 py-3.5 sm:py-4 mb-6 sm:mb-8 shadow-xs w-full">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <Link href="/" className="hover:opacity-90 transition min-w-0">
            <h1 className="text-base sm:text-xl font-black text-[#2B2B2B] tracking-tight truncate">
              My Wishlist 🔖
            </h1>
          </Link>
          <Link href="/" className="text-xs font-bold text-[#B76E79] hover:underline shrink-0 whitespace-nowrap">
            ← Continue Shopping
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 w-full">
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-[#8A7968]/20 shadow-xs">
            <div className="text-4xl mb-3">📑</div>
            <h2 className="text-base sm:text-lg font-bold text-[#2B2B2B] mb-1">Your wishlist is empty</h2>
            <p className="text-xs text-[#8A7968] mb-6">Save items you love by clicking the star icon on any product.</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold rounded-xl text-xs transition shadow-xs btn-press"
            >
              Explore Store
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-[#8A7968]">{wishlist.length} item(s) saved</span>
              <button
                onClick={clearWishlist}
                className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
              >
                Clear Wishlist
              </button>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-[#8A7968]/20 divide-y divide-[#8A7968]/15 overflow-hidden">
              {wishlist.map((item) => {
                const firstImg = item.image_url ? item.image_url.split(',')[0].trim() : 'https://via.placeholder.com/100'

                return (
                  <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Left side: Image & details */}
                    <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
                      <img
                        src={firstImg}
                        alt={item.name}
                        className="w-16 h-16 object-contain p-1 rounded-xl border border-[#8A7968]/20 bg-[#F4EADE]/40 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7968] block mb-0.5">
                          {item.category || 'Uncategorized'}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-[#2B2B2B] leading-snug line-clamp-2 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm sm:text-base font-black text-[#2B2B2B]">₹{item.price}</p>
                      </div>
                    </div>

                    {/* Right side: Action buttons */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#8A7968]/10">
                      <button
                        onClick={() => {
                          addToCart(item, 1)
                          removeFromWishlist(item.id)
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold text-xs rounded-xl shadow-xs transition whitespace-nowrap cursor-pointer btn-press"
                      >
                        Move to Cart 🛒
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition whitespace-nowrap cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}