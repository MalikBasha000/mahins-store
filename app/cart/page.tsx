// app/cart/page.tsx
'use client'

import { useCart } from '../context/CartContext'
import Link from 'next/link'

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart()

  const totalItemsCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)

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
📦 *Total Quantity:* ${totalItemsCount} item(s)
🚚 *Delivery:* Free
💰 *Total Payable Amount: ₹${totalPrice}*

Hi, I would like to order the items listed above. Please confirm availability and share payment/delivery instructions!`

    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/${STORE_PHONE}?text=${encoded}`, '_blank')
  }

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4EADE] px-4 py-8">
        <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-[#EFE3D3] p-6 sm:p-8 text-center shadow-xs border border-[#8A7968]/30">
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
      <div className="mx-auto max-w-4xl rounded-2xl sm:rounded-3xl bg-[#EFE3D3] p-4 sm:p-8 shadow-xs border border-[#8A7968]/30 w-full">
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

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-[#2B2B2B]">Your Shopping Cart</h2>
          <span className="text-xs font-bold text-[#8A7968]">
            {totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Item Cards */}
        <div className="space-y-4 mb-6 sm:mb-8">
          {cart.map((item) => {
            const firstImage = item.image_url ? item.image_url.split(',')[0].trim() : 'https://via.placeholder.com/80'
            const numericPrice = Number(item.price) || 0
            const numericQty = Number(item.quantity) || 1
            const lineTotal = numericPrice * numericQty

            return (
              <div key={item.id} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#8A7968]/30 bg-[#EADBC8]/40 shadow-2xs flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <img src={firstImage} alt={item.name} className="h-16 w-16 sm:h-20 sm:w-20 object-contain p-1 rounded-xl border border-[#8A7968]/30 bg-[#F4EADE] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#2B2B2B] text-xs sm:text-base leading-snug line-clamp-2">{item.name}</h3>
                    <p className="text-[11px] sm:text-xs text-[#8A7968] mt-1">
                      ₹{numericPrice} per unit
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#8A7968]/20">
                  {/* Quantity Control */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#8A7968]">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-14 sm:w-16 rounded-lg border border-[#8A7968]/40 bg-[#F4EADE] p-1 text-center text-xs sm:text-sm font-bold text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden"
                    />
                  </div>

                  {/* Explicit Calculation: Unit Price x Qty = Line Total */}
                  <div className="flex items-center gap-3 sm:gap-4 ml-auto">
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-bold text-[#2B2B2B]">
                        ₹{numericPrice} × {numericQty} = <span className="text-sm sm:text-base font-black text-[#2B2B2B]">₹{lineTotal}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer border border-red-200"
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
        <div className="bg-[#EADBC8]/60 p-4 sm:p-6 rounded-2xl border border-[#8A7968]/30 flex flex-col gap-4 w-full">
          {/* Detailed Price Calculation Breakdown */}
          <div className="space-y-2 border-b border-[#8A7968]/20 pb-4 text-xs sm:text-sm">
            <div className="flex justify-between text-[#8A7968]">
              <span>Items Total ({totalItemsCount} units)</span>
              <span className="font-bold text-[#2B2B2B]">₹{totalPrice}</span>
            </div>
            <div className="flex justify-between text-[#8A7968]">
              <span>Estimated Delivery / Shipping</span>
              <span className="font-bold text-green-700 uppercase">FREE</span>
            </div>
            <div className="flex justify-between items-center text-sm sm:text-base font-black text-[#2B2B2B] pt-2 border-t border-[#8A7968]/20">
              <span>Total Payable Amount</span>
              <span className="text-xl sm:text-2xl text-[#2B2B2B]">₹{totalPrice}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 w-full pt-1">
            <button
              onClick={clearCart}
              className="rounded-xl bg-[#EADBC8] border border-[#8A7968]/40 hover:bg-[#8A7968]/30 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#2B2B2B] transition w-full md:w-auto cursor-pointer"
            >
              Clear Cart
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={handleWhatsAppCheckout}
                className="w-full sm:w-auto rounded-xl bg-[#25D366] hover:bg-[#20ba59] px-5 py-3 font-bold text-white transition shadow-xs text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer btn-press"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>Order via WhatsApp</span>
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