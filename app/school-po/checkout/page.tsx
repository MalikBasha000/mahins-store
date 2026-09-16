// app/school-po/checkout/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { useSchoolPOCart } from '../../context/SchoolPOCartContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SchoolPOCheckoutPage() {
  const { schoolUser, poCart, poTotalPrice, clearPOCart } = useSchoolPOCart()
  const router = useRouter()
  const supabase = createClient()

  const [schoolName, setSchoolName] = useState('')
  const [educatorName, setEducatorName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [udiseCode, setUdiseCode] = useState('')
  const [atlCode, setAtlCode] = useState('')
  const [address, setAddress] = useState('')
  const [activeDiscountPercent, setActiveDiscountPercent] = useState<number>(15)
  const [loading, setLoading] = useState(false)
  const [confirmedTrackingId, setConfirmedTrackingId] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!schoolUser) {
      router.push('/school-po/auth')
      return
    }
    setSchoolName(schoolUser.school_name || '')
    setEducatorName(schoolUser.educator_name || '')
    setEmail(schoolUser.email || '')
    setPhone(schoolUser.phone || '')
    setUdiseCode(schoolUser.udise_code || '')
    setAtlCode(schoolUser.atl_code || '')
    setAddress(schoolUser.address || '')

    // Fetch active store discount percentage to lock into this specific order
    const fetchDiscount = async () => {
      try {
        const { data } = await supabase.from('store_settings').select('setting_value').eq('id', 'school_po_discount_percent').single()
        if (data && data.setting_value) {
          setActiveDiscountPercent(Number(data.setting_value) || 15)
        }
      } catch (err) {
        console.error('Error fetching discount setting:', err)
      }
    }
    fetchDiscount()
  }, [schoolUser, router, supabase])

  const generate13DigitPOTracking = () => {
    const random11 = Math.floor(10000000000 + Math.random() * 90000000000).toString()
    return `PO${random11}`
  }

  const handleSubmitPO = async (e: React.FormEvent) => {
    e.preventDefault()
    if (poCart.length === 0) {
      alert('Your School PO Cart is empty.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const generatedTracking = generate13DigitPOTracking()

      const { data, error } = await supabase.from('purchase_orders').insert([
        {
          tracking_id: generatedTracking,
          school_name: schoolName.trim(),
          educator_name: educatorName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          shipping_address: address.trim(),
          items: poCart,
          total_estimated_amount: poTotalPrice,
          discount_percent: activeDiscountPercent, // Lock in current store discount permanently
          status: 'Pending Review'
        }
      ]).select().single()

      if (error) throw error

      // Trigger automatic background email notification to Admin & School
      try {
        await fetch('/api/school-po/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'NEW_PO_ALERT',
            poId: data.id,
            trackingId: generatedTracking,
            schoolName: schoolName.trim(),
            educatorName: educatorName.trim(),
            customerEmail: email.trim().toLowerCase(),
            phone: phone.trim(),
            shippingAddress: address.trim(),
            items: poCart,
            totalAmount: poTotalPrice,
          })
        })
      } catch (mailErr) {
        console.warn('Notification email error:', mailErr)
      }

      setConfirmedTrackingId(generatedTracking)
      clearPOCart()
    } catch (err: any) {
      setErrorMsg(`Submission failed: ${err.message}`)
    }
    setLoading(false)
  }

  if (confirmedTrackingId) {
    return (
      <div className="min-h-screen bg-[#F4EADE] flex items-center justify-center p-6 text-[#2B2B2B]">
        <div className="bg-[#EFE3D3] p-8 rounded-3xl border border-[#8A7968]/30 max-w-lg text-center space-y-4 shadow-xl">
          <div className="text-4xl">🏛️</div>
          <h2 className="text-xl font-black">Official Purchase Order Placed!</h2>
          <div className="bg-[#F4EADE] p-4 rounded-2xl border border-[#8A7968]/30 space-y-1">
            <span className="text-[11px] font-bold text-[#8A7968] uppercase block">13-Digit PO Tracking Reference</span>
            <span className="font-mono text-lg font-black text-[#B76E79] select-all tracking-wider">{confirmedTrackingId}</span>
          </div>
          <p className="text-xs text-[#8A7968] leading-relaxed">
            Thank you, <span className="font-bold text-[#2B2B2B]">{educatorName}</span>. Your institutional PO request for <span className="font-bold text-[#2B2B2B]">{schoolName}</span> has been dispatched with a locked <span className="font-bold text-[#2B2B2B]">{activeDiscountPercent}%</span> educational discount. A confirmation summary has been sent to <span className="font-bold text-[#2B2B2B]">{email}</span>.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              href="/school-po/orders"
              className="bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-xs"
            >
              View My PO Orders
            </Link>
            <Link
              href="/school-po/track"
              className="bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] font-bold text-xs px-5 py-3 rounded-xl border border-[#8A7968]/30 transition"
            >
              Track Order Live
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4EADE] px-4 sm:px-8 py-6 sm:py-8 text-[#2B2B2B]">
      <div className="max-w-3xl mx-auto bg-[#EFE3D3] p-6 sm:p-8 rounded-3xl border border-[#8A7968]/30 shadow-xs space-y-6">
        <div className="flex justify-between items-center border-b border-[#8A7968]/20 pb-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-black">🏛️ Finalize School Purchase Order</h1>
            <p className="text-xs text-[#8A7968]">Confirm institutional details and generate an official quote request ({activeDiscountPercent}% Educational Discount Applied)</p>
          </div>
          <Link href="/school-po/cart" className="text-xs font-bold text-[#B76E79] hover:underline">
            ← Back to PO Cart
          </Link>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-100 text-red-700 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* PO Items Summary */}
        <div className="bg-[#F4EADE] p-4 rounded-2xl border border-[#8A7968]/30 space-y-2">
          <h3 className="text-xs font-bold text-[#B76E79] uppercase">Items Summary ({poCart.length} products)</h3>
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {poCart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#EFE3D3] p-2 rounded-xl">
                <div>
                  <span className="font-bold block truncate max-w-sm">{item.name}</span>
                  <span className="text-[10px] text-[#8A7968]">₹{item.price} × {item.quantity}</span>
                </div>
                <span className="font-black text-[#2B2B2B]">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#8A7968]/20 pt-2 flex justify-between text-sm font-black text-[#B76E79]">
            <span>Total Payable PO Amount:</span>
            <span>₹{poTotalPrice}</span>
          </div>
        </div>

        <form onSubmit={handleSubmitPO} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">School Name *</label>
              <input type="text" required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Educator / Incharge Name *</label>
              <input type="text" required value={educatorName} onChange={(e) => setEducatorName(e.target.value)} className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Official School Email *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Phone Number *</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">UDISE Code *</label>
              <input type="text" required value={udiseCode} onChange={(e) => setUdiseCode(e.target.value)} className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs font-mono uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">ATL Code (Optional)</label>
              <input type="text" value={atlCode} onChange={(e) => setAtlCode(e.target.value)} className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs font-mono uppercase" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Delivery Address *</label>
            <textarea rows={2} required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B76E79] hover:bg-[#9E5B65] text-white font-black py-3.5 rounded-xl text-sm transition cursor-pointer btn-press"
          >
            {loading ? 'Submitting Purchase Order...' : 'Confirm & Place Official Purchase Order 🏛️'}
          </button>
        </form>
      </div>
    </div>
  )
}