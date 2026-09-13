// app/po-checkout/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useCart } from '../context/CartContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PurchaseOrderCheckout() {
  const { cart, clearCart } = useCart()
  const router = useRouter()
  const supabase = createClient()

  const [schoolName, setSchoolName] = useState('')
  const [educatorName, setEducatorName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0)
  // Apply a default 15% educational bulk discount estimate
  const bulkDiscount = Math.round(subtotal * 0.15)
  const finalEstimate = subtotal - bulkDiscount

  const handleSubmitPO = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      alert('Your cart is empty.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const { error } = await supabase.from('purchase_orders').insert([{
        school_name: schoolName.trim(),
        educator_name: educatorName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        shipping_address: address.trim(),
        items: cart,
        total_estimated_amount: finalEstimate,
        status: 'Pending Review'
      }])

      if (error) throw error

      setSuccessMsg(true)
      clearCart()
    } catch (err: any) {
      setErrorMsg(`Failed to submit Purchase Order: ${err.message}`)
    }
    setLoading(false)
  }

  if (successMsg) {
    return (
      <div className="min-h-screen bg-[#F4EADE] flex flex-col items-center justify-center p-6 text-[#2B2B2B]">
        <div className="bg-[#EFE3D3] p-8 rounded-3xl border border-[#8A7968]/30 max-w-lg text-center space-y-4 shadow-xl">
          <div className="text-4xl">🏛️</div>
          <h2 className="text-xl font-black text-[#2B2B2B]">School Purchase Order Submitted!</h2>
          <p className="text-xs text-[#8A7968] leading-relaxed">
            Thank you, <span className="font-bold text-[#2B2B2B]">{educatorName}</span>. Your institutional quote request for <span className="font-bold text-[#2B2B2B]">{schoolName}</span> has been received with a 15% educational discount applied. Our team will email the official quotation and offline invoice shortly.
          </p>
          <Link href="/" className="inline-block bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold text-xs px-6 py-3 rounded-xl transition">
            Return to Storefront 🏠
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4EADE] px-4 py-8 text-[#2B2B2B]">
      <div className="mx-auto max-w-3xl bg-[#EFE3D3] p-6 sm:p-8 rounded-3xl border border-[#8A7968]/30 shadow-xs space-y-6">
        <div className="flex justify-between items-center border-b border-[#8A7968]/20 pb-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-[#2B2B2B]">🏛️ Institutional / School PO Checkout</h1>
            <p className="text-xs text-[#8A7968] mt-0.5">Request official quotes and apply bulk educational discounts (15% OFF)</p>
          </div>
          <Link href="/cart" className="text-xs font-bold text-[#B76E79] hover:underline">← Back to Cart</Link>
        </div>

        {errorMsg && <div className="p-3 bg-red-100 text-red-700 rounded-xl text-xs font-semibold">{errorMsg}</div>}

        <div className="bg-[#F4EADE] p-4 rounded-2xl border border-[#8A7968]/30 space-y-2">
          <h3 className="text-xs font-bold text-[#B76E79] uppercase">Order Summary ({cart.length} items)</h3>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#EFE3D3] p-2 rounded-xl">
                <span className="font-bold text-[#2B2B2B] truncate">{item.name} (x{item.quantity})</span>
                <span className="font-black">₹{Number(item.price || 0) * Number(item.quantity || 1)}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-[#8A7968]/20 flex justify-between text-xs font-bold">
            <span>Subtotal: ₹{subtotal}</span>
            <span className="text-green-700">Educational Discount (15%): -₹{bulkDiscount}</span>
          </div>
          <div className="text-sm font-black text-[#B76E79] pt-1">
            Estimated Institutional Total: ₹{finalEstimate}
          </div>
        </div>

        <form onSubmit={handleSubmitPO} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2B2B2B] mb-1">School / Institution Name *</label>
              <input type="text" required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g. Government High School, Bolaram" className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Educator / Administrator Name *</label>
              <input type="text" required value={educatorName} onChange={(e) => setEducatorName(e.target.value)} placeholder="e.g. Mahin Instructor" className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Official Email Address *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="educator@school.edu.in" className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Contact Phone Number *</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Official School Delivery Address *</label>
            <textarea rows={3} required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter full school shipping address with pincode..." className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold p-3.5 rounded-xl text-sm shadow-xs transition cursor-pointer btn-press">
            {loading ? 'Submitting Purchase Order...' : 'Submit Institutional PO Request 🏛️'}
          </button>
        </form>
      </div>
    </div>
  )
}