// app/wishlist/page.tsx
'use client'

import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import Link from 'next/link'

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist()
  const { addToCart } = useCart()

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white border-b border-gray-200 px-6 py-4 mb-8 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-indigo-950">My Wishlist ❤️</h1>
          <Link href="/" className="text-xs font-bold text-indigo-600 hover:underline">
            ← Continue Shopping
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4">
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
            <div className="text-4xl mb-3">🤍</div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Your wishlist is empty</h2>
            <p className="text-xs text-gray-500 mb-6">Save items you love by clicking the heart icon on any product.</p>
            <Link href="/" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md">
              Explore Store
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-gray-600">{wishlist.length} item(s) saved</span>
              <button onClick={clearWishlist} className="text-xs font-bold text-red-600 hover:underline">
                Clear Wishlist
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {wishlist.map((item) => {
                const firstImg = item.image_url ? item.image_url.split(',')[0].trim() : 'https://via.placeholder.com/100'

                return (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <img src={firstImg} alt={item.name} className="w-16 h-16 object-cover rounded-xl border flex-shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">{item.category}</span>
                        <h3 className="text-sm font-bold text-gray-900">{item.name}</h3>
                        <p className="text-xs font-black text-gray-800 mt-1">₹{item.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => {
                          addToCart(item, 1)
                          removeFromWishlist(item.id)
                        }}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                      >
                        Move to Cart 🛒
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition"
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