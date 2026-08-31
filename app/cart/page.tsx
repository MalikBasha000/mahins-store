// app/cart/page.tsx
'use client'

import { useCart } from '../context/CartContext'
import Link from 'next/link'

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart()

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="text-4xl mb-3">🛒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-500 text-sm mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Link
            href="/"
            className="inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 transition shadow text-sm"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-md">
        <div className="text-center mb-6 pb-4 border-b">
          <h1 className="text-2xl font-black text-indigo-900">Mahin's One-Stop One-Store</h1>
        </div>

        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-sm text-indigo-600 hover:underline">← Continue Shopping</Link>
          <h2 className="text-xl font-bold text-gray-900">Your Shopping Cart</h2>
        </div>

        <div className="space-y-4 mb-8">
          {cart.map((item) => {
            const firstImage = item.image_url ? item.image_url.split(',')[0].trim() : 'https://via.placeholder.com/80'
            const numericPrice = Number(item.price) || 0
            const numericQty = Number(item.quantity) || 1
            const lineTotal = numericPrice * numericQty

            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div className="flex items-center gap-4">
                  <img src={firstImage} alt={item.name} className="h-20 w-20 object-cover rounded-xl border bg-gray-100" />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ₹{numericPrice} per unit &nbsp;•&nbsp; <span className="font-semibold text-indigo-600">₹{numericPrice} × {numericQty} = ₹{lineTotal}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-16 rounded-lg border border-gray-300 p-1.5 text-center text-sm font-bold text-gray-900 focus:outline-indigo-600"
                    />
                  </div>

                  <span className="text-lg font-black text-indigo-900 min-w-[80px] text-right">
                    ₹{lineTotal}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <button
            onClick={clearCart}
            className="rounded-xl bg-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-300 transition w-full md:w-auto cursor-pointer"
          >
            Clear Cart
          </button>

          <div className="flex items-center justify-between w-full md:w-auto gap-8">
            <div className="text-right">
              <span className="text-xs text-gray-500 block">Total Amount:</span>
              <span className="text-2xl font-black text-indigo-900">₹{totalPrice}</span>
            </div>
            <Link
              href="/checkout"
              className="rounded-xl bg-green-600 px-8 py-3 font-bold text-white hover:bg-green-700 transition shadow text-sm text-center"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}