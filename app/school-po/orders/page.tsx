// app/school-po/orders/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { useSchoolPOCart } from '../../context/SchoolPOCartContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SchoolPOOrdersPage() {
  const { schoolUser } = useSchoolPOCart()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('school_po_user') : null
    if (!saved && !schoolUser) {
      router.push('/school-po/auth')
      return
    }

    const fetchSchoolOrders = async () => {
      const userObj = schoolUser || (saved ? JSON.parse(saved) : null)
      if (!userObj?.email) return

      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('email', userObj.email.trim().toLowerCase())
        .order('created_at', { ascending: false })

      if (data) setOrders(data)
      setLoading(false)
    }

    fetchSchoolOrders()
  }, [schoolUser, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EADE] flex items-center justify-center font-bold text-[#8A7968]">
        Loading School Purchase Orders...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4EADE] text-[#2B2B2B] px-4 sm:px-8 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-[#EFE3D3] p-5 sm:p-6 rounded-3xl border border-[#8A7968]/30 shadow-xs flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-black">📋 Institutional Purchase Orders</h1>
            <p className="text-xs text-[#8A7968]">
              Track your institution's quotation requests, PO approvals, and fulfillments.
            </p>
          </div>
          <Link
            href="/school-po"
            className="bg-[#B76E79] hover:bg-[#9E5B65] text-white text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            ← Back to PO Catalog
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-[#EFE3D3] p-8 rounded-3xl border border-[#8A7968]/30 text-center space-y-3">
            <p className="text-sm font-bold text-[#8A7968]">No purchase orders found for this institution yet.</p>
            <Link
              href="/school-po"
              className="inline-block bg-[#B76E79] text-white text-xs font-bold px-5 py-2.5 rounded-xl"
            >
              Start New PO Request 🚀
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((po) => (
              <div key={po.id} className="bg-[#EFE3D3] p-5 rounded-3xl border border-[#8A7968]/30 space-y-3 shadow-xs">
                <div className="flex flex-wrap justify-between items-center border-b border-[#8A7968]/20 pb-2.5 gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#8A7968] uppercase">Order ID / Reference</span>
                    <div className="font-mono font-bold text-xs">{po.id.slice(0, 13)}...</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-[#8A7968] uppercase">Status</span>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                        {po.status || 'Pending Review'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-[#8A7968] uppercase">Total Estimate</span>
                    <div className="text-base font-black text-[#B76E79]">₹{po.total_estimated_amount}</div>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <div className="font-bold text-[#8A7968] uppercase text-[10px]">Items Included:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Array.isArray(po.items) && po.items.map((it: any, i: number) => (
                      <div key={i} className="bg-[#F4EADE] p-2 rounded-xl text-xs flex justify-between">
                        <span className="truncate">{it.name}</span>
                        <span className="font-bold">x{it.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}