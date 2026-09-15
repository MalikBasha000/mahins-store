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
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const fetchSchoolOrders = async () => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('school_po_user') : null
    const userObj = schoolUser || (saved ? JSON.parse(saved) : null)
    if (!userObj?.email) {
      router.push('/school-po/auth')
      return
    }

    const { data } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('email', userObj.email.trim().toLowerCase())
      .order('created_at', { ascending: false })

    if (data) setOrders(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchSchoolOrders()
  }, [schoolUser, router])

  const handleCancelOrder = async (poId: string) => {
    const confirmCancel = confirm('Are you sure you want to cancel this Purchase Order request?')
    if (!confirmCancel) return

    const { error } = await supabase
      .from('purchase_orders')
      .update({ status: 'Cancelled' })
      .eq('id', poId)

    if (error) {
      alert(`Error cancelling PO: ${error.message}`)
    } else {
      alert('Purchase order cancelled successfully.')
      fetchSchoolOrders()
    }
  }

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
            {orders.map((po) => {
              const trackingCode = po.tracking_id || `PO${po.id.replace(/-/g, '').slice(0, 11).toUpperCase()}`
              const isPending = (po.status || 'Pending Review') === 'Pending Review'

              return (
                <div key={po.id} className="bg-[#EFE3D3] p-5 rounded-3xl border border-[#8A7968]/30 space-y-4 shadow-xs">
                  <div className="flex flex-wrap justify-between items-center border-b border-[#8A7968]/20 pb-3 gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold text-[#8A7968] uppercase block">13-Digit PO Tracking ID</span>
                      <div className="font-mono font-black text-sm text-[#2B2B2B]">{trackingCode}</div>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-[#8A7968] uppercase block">PO Status</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black inline-block ${
                        po.status === 'Cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                        po.status === 'PO Approved' || po.status === 'Completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                        'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {po.status || 'Pending Review'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold text-[#8A7968] uppercase block">Total Estimate</span>
                      <div className="text-lg font-black text-[#B76E79]">₹{po.total_estimated_amount}</div>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <div className="overflow-x-auto rounded-xl border border-[#8A7968]/20 bg-[#F4EADE]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#EADBC8] border-b border-[#8A7968]/20 font-bold text-[#2B2B2B]">
                          <th className="p-2.5">Item Name (Click to view)</th>
                          <th className="p-2.5 text-center">Unit Price</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(po.items) && po.items.map((it: any, idx: number) => {
                          const unitPrice = Number(it.price) || 0
                          const qty = Number(it.quantity) || 1
                          return (
                            <tr key={idx} className="border-b border-[#8A7968]/15 hover:bg-[#EADBC8]/40">
                              <td className="p-2.5 font-bold text-[#B76E79]">
                                <button
                                  type="button"
                                  onClick={() => setSelectedProduct(it)}
                                  className="hover:underline text-left cursor-pointer flex items-center gap-2"
                                >
                                  {it.image_url && (
                                    <img src={it.image_url.split(',')[0]} alt="" className="w-7 h-7 object-cover rounded-md bg-white border border-[#8A7968]/20" />
                                  )}
                                  <span>{it.name}</span>
                                </button>
                              </td>
                              <td className="p-2.5 text-center font-bold">₹{unitPrice}</td>
                              <td className="p-2.5 text-center font-extrabold">{qty}</td>
                              <td className="p-2.5 text-right font-black">₹{unitPrice * qty}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap justify-between items-center text-xs pt-1">
                    <span className="text-[#8A7968]">Submitted On: {new Date(po.created_at).toLocaleString()}</span>
                    {isPending && (
                      <button
                        onClick={() => handleCancelOrder(po.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl border border-red-200 transition cursor-pointer"
                      >
                        Cancel Request ✕
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Product Details Lightbox Dialog */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-[#2B2B2B]/85 backdrop-blur-xs flex justify-center items-center p-4 z-50">
            <div className="bg-[#EFE3D3] border border-[#8A7968]/40 rounded-3xl shadow-2xl w-full max-w-md p-6 relative space-y-4 text-[#2B2B2B]">
              <div className="flex justify-between items-center border-b border-[#8A7968]/20 pb-2">
                <h3 className="font-bold text-sm">Product Specifications</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="bg-[#EADBC8] text-xs px-2.5 py-1 rounded-full font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="h-44 bg-[#F4EADE] rounded-2xl flex items-center justify-center p-2 border border-[#8A7968]/30">
                <img
                  src={selectedProduct.image_url?.split(',')[0] || 'https://via.placeholder.com/200'}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <h4 className="font-black text-base">{selectedProduct.name}</h4>
                <div className="text-sm font-extrabold text-[#B76E79] mt-1">₹{selectedProduct.price} / unit</div>
                {selectedProduct.description && (
                  <p className="text-xs text-[#8A7968] mt-2 leading-relaxed">{selectedProduct.description}</p>
                )}
              </div>

              <div className="pt-2">
                <Link
                  href={`/product/${selectedProduct.id}`}
                  className="block text-center w-full bg-[#B76E79] text-white text-xs font-bold py-2.5 rounded-xl"
                >
                  Open Full Store Page ↗
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}