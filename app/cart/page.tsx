// app/cart/page.tsx
'use client'

import { useCart } from '../context/CartContext'
import Link from 'next/link'

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart()

  const handleWhatsAppCheckout = () => {
    const STORE_PHONE = '919989945139'

    const itemsSummary = cart
      .map(
        (item, idx) =>
          `${idx + 1}. *${item.name}*\n   Qty: ${item.quantity} × ₹${item.price} = ₹${(Number(item.quantity) || 1) * (Number(item.price) || 0)}`
      )
      .join('\n\n')

    const message = 
`🛍️ *NEW ORDER REQUEST via WhatsApp*
*Store:* Mahin's One-Stop One-Store
-----------------------------------
${itemsSummary}
-----------------------------------
💰 *Total Payable Amount: ₹${totalPrice}*

Hi, I would like to order the items listed above. Please confirm availability and share payment/delivery instructions!`

    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/${STORE_PHONE}?text=${encoded}`, '_blank')
  }

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-8 text-center shadow-xs border border-gray-200">
          <div className="text-4xl mb-3">🛒</div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-500 text-xs sm:text-sm mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Link
            href="/"
            className="inline-block rounded-xl bg-indigo-600 px-6 py-2.5 sm:py-3 font-semibold text-white hover:bg-indigo-700 transition shadow-xs text-xs sm:text-sm btn-press"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full overflow-x-hidden">
      <div className="mx-auto max-w-4xl rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-8 shadow-xs border border-gray-200 w-full">
        {/* Responsive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-5 gap-2">
          <Link href="/" className="hover:opacity-90 transition min-w-0">
            <h1 className="text-base sm:text-2xl font-black text-indigo-900 tracking-tight truncate">
              Mahin's One-Stop One-Store
            </h1>
          </Link>
          <Link href="/" className="inline-flex items-center text-xs font-bold text-indigo-600 hover:underline shrink-0">
            ← Continue Shopping
          </Link>
        </div>

        <div className="mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Shopping Cart</h2>
        </div>

        {/* Cart Item Cards */}
        <div className="space-y-4 mb-6 sm:mb-8">
          {cart.map((item) => {
            const firstImage = item.image_url ? item.image_url.split(',')[0].trim() : 'https://via.placeholder.com/80'
            const numericPrice = Number(item.price) || 0
            const numericQty = Number(item.quantity) || 1
            const lineTotal = numericPrice * numericQty

            return (
              <div key={item.id} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 bg-white shadow-2xs flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <img src={firstImage} alt={item.name} className="h-16 w-16 sm:h-20 sm:w-20 object-contain p-1 rounded-xl border border-gray-200 bg-gray-50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-base leading-snug line-clamp-2">{item.name}</h3>
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
                      ₹{numericPrice} per unit
                    </p>
                  </div>
                </div>

                {/* Mobile Bottom Action Row for Each Item */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-14 sm:w-16 rounded-lg border border-gray-300 p-1 text-center text-xs sm:text-sm font-bold text-gray-900 focus:outline-indigo-600"
                    />
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-sm sm:text-base font-black text-indigo-900">
                      ₹{lineTotal}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary Footer */}
        <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 w-full">
          <button
            onClick={clearCart}
            className="rounded-xl bg-gray-200 hover:bg-gray-300 px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 transition w-full md:w-auto cursor-pointer"
          >
            Clear Cart
          </button>

          <div className="flex flex-col sm:flex-row items-center justify-between w-full md:w-auto gap-3 sm:gap-6">
            <div className="text-center sm:text-right w-full sm:w-auto">
              <span className="text-xs text-gray-500 block">Total Amount:</span>
              <span className="text-xl sm:text-2xl font-black text-indigo-900">₹{totalPrice}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleWhatsAppCheckout}
                className="w-full sm:w-auto rounded-xl bg-green-600 hover:bg-green-700 px-5 py-3 font-bold text-white transition shadow-xs text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer btn-press"
              >
                <span>💬</span> Order via WhatsApp
              </button>

              <Link
                href="/checkout"
                className="w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 font-bold text-white transition shadow-xs text-xs sm:text-sm text-center btn-press"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}