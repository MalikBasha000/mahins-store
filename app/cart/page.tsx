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
      <div className="flex min-h-screen items-center justify-center bg-[#F4EADE] px-4 py-8">
        <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-8 text-center shadow-xs border border-[#8A7968]/20">
          <div className="text-4xl mb-3">🛒</div>
          <h2 className="text-lg sm:text-xl font-bold text-[#2B2B2B] mb-2">Your Cart is Empty</h2>
          <p className="text-[#8A7968] text-xs sm:text-sm mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Link
            href="/"
            className="inline-block rounded-xl bg-[#B76E79] hover:bg-[#9E5B65] px-6 py-2.5 sm:py-3 font-semibold text-white transition shadow-xs text-xs sm:text-sm btn-press"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4EADE] px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full overflow-x-hidden text-[#2B2B2B]">
      <div className="mx-auto max-w-4xl rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-8 shadow-xs border border-[#8A7968]/20 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#8A7968]/20 pb-4 mb-5 gap-2">
          <Link href="/" className="hover:opacity-90 transition min-w-0">
            <h1 className="text-base sm:text-2xl font-black text-[#2B2B2B] tracking-tight truncate">
              Mahin's One-Stop One-Store
            </h1>
          </Link>
          <Link href="/" className="inline-flex items-center text-xs font-bold text-[#B76E79] hover:underline shrink-0">
            ← Continue Shopping
          </Link>
        </div>

        <div className="mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-[#2B2B2B]">Your Shopping Cart</h2>
        </div>

        {/* Item Cards */}
        <div className="space-y-4 mb-6 sm:mb-8">
          {cart.map((item) => {
            const firstImage = item.image_url ? item.image_url.split(',')[0].trim() : 'https://via.placeholder.com/80'
            const numericPrice = Number(item.price) || 0
            const numericQty = Number(item.quantity) || 1
            const lineTotal = numericPrice * numericQty

            return (
              <div key={item.id} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#8A7968]/20 bg-white shadow-2xs flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <img src={firstImage} alt={item.name} className="h-16 w-16 sm:h-20 sm:w-20 object-contain p-1 rounded-xl border border-[#8A7968]/20 bg-[#F4EADE]/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#2B2B2B] text-xs sm:text-base leading-snug line-clamp-2">{item.name}</h3>
                    <p className="text-[11px] sm:text-xs text-[#8A7968] mt-1">
                      ₹{numericPrice} per unit
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#8A7968]/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#8A7968]">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-14 sm:w-16 rounded-lg border border-[#8A7968]/40 p-1 text-center text-xs sm:text-sm font-bold text-[#2B2B2B] focus:outline-[#B76E79]"
                    />
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-sm sm:text-base font-black text-[#2B2B2B]">
                      ₹{lineTotal}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Summary */}
        <div className="bg-[#F4EADE]/50 p-4 sm:p-6 rounded-2xl border border-[#8A7968]/20 flex flex-col md:flex-row justify-between items-center gap-4 w-full">
          <button
            onClick={clearCart}
            className="rounded-xl bg-white border border-[#8A7968]/30 hover:bg-gray-100 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#2B2B2B] transition w-full md:w-auto cursor-pointer"
          >
            Clear Cart
          </button>

          <div className="flex flex-col sm:flex-row items-center justify-between w-full md:w-auto gap-3 sm:gap-6">
            <div className="text-center sm:text-right w-full sm:w-auto">
              <span className="text-xs text-[#8A7968] block">Total Amount:</span>
              <span className="text-xl sm:text-2xl font-black text-[#2B2B2B]">₹{totalPrice}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleWhatsAppCheckout}
                className="w-full sm:w-auto rounded-xl bg-green-700 hover:bg-green-800 px-5 py-3 font-bold text-white transition shadow-xs text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer btn-press"
              >
                <span>💬</span> Order via WhatsApp
              </button>

              <Link
                href="/checkout"
                className="w-full sm:w-auto rounded-xl bg-[#B76E79] hover:bg-[#9E5B65] px-6 py-3 font-bold text-white transition shadow-xs text-xs sm:text-sm text-center btn-press"
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