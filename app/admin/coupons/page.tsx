// app/admin/coupons/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'
import Link from 'next/link'

export default function AdminCouponsPage() {
  const supabase = createClient()
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [targetEmail, setTargetEmail] = useState('') // Specific customer restriction

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setCoupons(data)
    setLoading(false)
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !discountValue) {
      alert('Please fill in code and discount value.')
      return
    }

    const { error } = await supabase.from('coupons').insert([
      {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_amount: Number(minOrder) || 0,
        target_customer_email: targetEmail.trim() ? targetEmail.trim().toLowerCase() : null,
        is_active: true
      }
    ])

    if (error) {
      alert(`Error creating coupon: ${error.message}`)
      return
    }

    setCode('')
    setDiscountValue('')
    setMinOrder('')
    setTargetEmail('')
    fetchCoupons()
    alert('Targeted coupon created successfully!')
  }

  const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id)
    fetchCoupons()
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    await supabase.from('coupons').delete().eq('id', id)
    fetchCoupons()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl bg-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <Link href="/admin" className="text-xs font-bold text-indigo-600 hover:underline">← Back to Admin Dashboard</Link>
          <h1 className="text-xl font-black text-indigo-950">Targeted Coupon Management 🏷️</h1>
        </div>

        {/* Create Targeted Coupon Form */}
        <form onSubmit={handleCreateCoupon} className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mb-8 space-y-4">
          <h2 className="text-sm font-bold text-indigo-950 uppercase">Create New Discount / Targeted Coupon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Coupon Code</label>
              <input
                type="text"
                placeholder="e.g. SPECIALFORMAHIN"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border p-2.5 rounded-xl text-xs font-mono uppercase bg-white text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full border p-2.5 rounded-xl text-xs bg-white text-gray-900 font-bold"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Value ({discountType === 'percentage' ? '%' : '₹'})</label>
              <input
                type="number"
                placeholder={discountType === 'percentage' ? 'e.g. 15' : 'e.g. 100'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full border p-2.5 rounded-xl text-xs bg-white text-gray-900 font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Min Order Amount (₹) Optional</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                className="w-full border p-2.5 rounded-xl text-xs bg-white text-gray-900 font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Assign to Specific Customer Email (Optional)</label>
              <input
                type="email"
                placeholder="Leave blank for public use, or enter customer email (e.g. student@gmail.com)"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                className="w-full border p-2.5 rounded-xl text-xs bg-white text-gray-900 font-medium"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">If specified, only this customer email can redeem this coupon code at checkout.</span>
            </div>
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer">
            Create Coupon Code 🚀
          </button>
        </form>

        {/* Coupons List */}
        <h2 className="text-sm font-bold text-gray-800 uppercase mb-4">Active & Existing Coupons</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500 text-xs">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs">No discount coupons created yet.</div>
        ) : (
          <div className="space-y-3">
            {coupons.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between border p-4 rounded-2xl bg-white shadow-sm gap-2">
                <div>
                  <span className="font-mono font-black text-indigo-900 text-sm tracking-wider">{c.code}</span>
                  <div className="text-xs text-gray-600 mt-0.5 font-medium">
                    {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`} 
                    {c.min_order_amount > 0 ? ` (Min order: ₹${c.min_order_amount})` : ''}
                  </div>
                  <div className="text-[11px] text-indigo-600 font-bold mt-1">
                    {c.target_customer_email ? `🔒 Restricted to: ${c.target_customer_email}` : '🌐 Public Coupon (Anyone can use)'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleCouponStatus(c.id, c.is_active)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {c.is_active ? 'Active ✓' : 'Inactive ✕'}
                  </button>
                  <button
                    onClick={() => deleteCoupon(c.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}