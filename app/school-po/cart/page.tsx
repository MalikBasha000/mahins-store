// app/school-po/cart/page.tsx
'use client'

import { useSchoolPOCart } from '../../context/SchoolPOCartContext'
import Link from 'next/link'

export default function SchoolPOCartPage() {
  const { 
    schoolUser, 
    poCart, 
    updatePOQuantity, 
    removeFromPOCart, 
    clearPOCart, 
    poTotalItems, 
    poTotalPrice 
  } = useSchoolPOCart()

  if (poCart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4EADE] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#EFE3D3] p-8 rounded-3xl border border-[#8A7968]/30 text-center space-y-4 shadow-xs">
          <div className="text-4xl">🏛️</div>
          <h2 className="text-xl font-bold">Your School PO Cart is Empty</h2>
          <p className="text-xs text-[#8A7968]">
            Add components and lab kits from the institutional catalog.
          </p>
          <Link
            href="/school-po"
            className="inline-block bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold text-xs px-6 py-3 rounded-xl transition btn-press"
          >
            Browse School Catalog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4EADE] px-4 sm:px-8 py-6 sm:py-8 text-[#2B2B2B]">
      <div className="max-w-4xl mx-auto bg-[#EFE3D3] p-5 sm:p-8 rounded-3xl border border-[#8A7968]/30 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#8A7968]/20 pb-4 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black">🏛️ School PO Cart</h1>
              <span className="bg-[#B76E79] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {poTotalItems} items
              </span>
            </div>
            {schoolUser && (
              <p className="text-xs text-[#8A7968] mt-0.5">
                Ordering for: <span className="font-bold text-[#2B2B2B]">{schoolUser.school_name}</span> (UDISE: {schoolUser.udise_code})
              </p>
            )}
          </div>
          <Link href="/school-po" className="text-xs font-bold text-[#B76E79] hover:underline">
            ← Back to PO Catalog
          </Link>
        </div>

        {/* PO Cart Items */}
        <div className="space-y-3">
          {poCart.map((item) => (
            <div key={item.id} className="bg-[#F4EADE] p-4 rounded-2xl border border-[#8A7968]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                {item.image_url && (
                  <img src={item.image_url.split(',')[0]} alt="" className="w-14 h-14 object-contain rounded-xl border border-[#8A7968]/30 bg-white p-1 shrink-0" />
                )}
                <div>
                  <h3 className="text-sm font-bold truncate max-w-sm">{item.name}</h3>
                  <span className="text-xs font-black text-[#B76E79]">₹{item.price} per unit</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8A7968]">Qty:</span>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updatePOQuantity(item.id, parseInt(e.target.value) || 1)}
                    className="w-16 border border-[#8A7968]/40 bg-[#EFE3D3] p-1.5 rounded-xl text-center text-xs font-bold"
                  />
                </div>
                <div className="font-black text-sm w-20 text-right">
                  ₹{item.price * item.quantity}
                </div>
                <button
                  onClick={() => removeFromPOCart(item.id)}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="bg-[#F4EADE] p-5 rounded-2xl border border-[#8A7968]/30 space-y-3">
          <div className="flex justify-between text-xs text-[#8A7968]">
            <span>Institutional Subtotal ({poTotalItems} units)</span>
            <span className="font-bold text-[#2B2B2B]">₹{poTotalPrice}</span>
          </div>
          <div className="flex justify-between text-xs text-[#8A7968]">
            <span>Institutional Shipping</span>
            <span className="font-bold text-green-700 uppercase">FREE</span>
          </div>
          <div className="flex justify-between text-base font-black border-t border-[#8A7968]/20 pt-2 text-[#2B2B2B]">
            <span>Total Estimated PO Value</span>
            <span className="text-xl text-[#B76E79]">₹{poTotalPrice}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            onClick={clearPOCart}
            className="w-full sm:w-auto bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] text-xs font-bold px-5 py-3 rounded-xl border border-[#8A7968]/30 cursor-pointer"
          >
            Clear PO Cart
          </button>
          <Link
            href="/school-po/checkout"
            className="w-full sm:w-auto bg-[#B76E79] hover:bg-[#9E5B65] text-white text-xs sm:text-sm font-black px-8 py-3 rounded-xl text-center shadow-xs transition btn-press"
          >
            Proceed to School PO Checkout 🏛️
          </Link>
        </div>
      </div>
    </div>
  )
}