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
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  
  // Rejection modal state
  const [rejectModalOrder, setRejectModalOrder] = useState<any | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

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

  const handleAcceptQuote = async (orderId: string) => {
    if (!confirm('Are you sure you want to accept this official quotation and confirm order placement?')) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/school-po/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poId: orderId, status: 'PO Approved' }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      await fetchSchoolOrders()
    } catch (err: any) {
      alert(err.message || 'Failed to approve quotation.')
    }
    setActionLoading(false)
  }

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectionReason.trim()) {
      alert('Please state a reason for declining this quotation.')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/school-po/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poId: rejectModalOrder.id,
          status: 'Rejected by School',
          rejectionReason: rejectionReason.trim(),
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setRejectModalOrder(null)
      setRejectionReason('')
      await fetchSchoolOrders()
    } catch (err: any) {
      alert(err.message || 'Failed to record rejection.')
    }
    setActionLoading(false)
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
              const isQuoteSent = po.status === 'Quote Sent'

              return (
                <div key={po.id} className="bg-[#EFE3D3] p-5 rounded-3xl border border-[#8A7968]/30 space-y-4 shadow-xs">
                  <div className="flex flex-wrap justify-between items-center border-b border-[#8A7968]/20 pb-3 gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold text-[#8A7968] uppercase block">13-Digit PO Tracking ID</span>
                      <div className="font-mono font-black text-sm text-[#2B2B2B]">{trackingCode}</div>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-[#8A7968] uppercase block">PO Status</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black inline-block border ${
                        po.status === 'Quote Sent' ? 'bg-[#B76E79] text-white border-[#B76E79] animate-pulse' :
                        po.status === 'PO Approved' ? 'bg-green-100 text-green-800 border-green-300' :
                        po.status === 'In Transit' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        po.status === 'Delivered' || po.status === 'Completed' || po.status === 'Completed / Fulfilled' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        po.status === 'Rejected by School' || po.status === 'Cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {po.status || 'Pending Review'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold text-[#8A7968] uppercase block">Total Estimate</span>
                      <div className="text-lg font-black text-[#B76E79]">₹{po.total_estimated_amount || po.total_estimate || po.total}</div>
                    </div>
                  </div>

                  {/* QUOTE ACTION BANNER (When Quote Sent) */}
                  {isQuoteSent && (
                    <div className="bg-[#B76E79]/10 border border-[#B76E79]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-black text-[#B76E79] flex items-center gap-1.5">
                          <span>🔔</span> Official Quotation Ready for Review
                        </div>
                        <p className="text-[11px] text-[#2B2B2B] mt-0.5">
                          Please verify your requested items and total cost. You can accept this quotation to proceed with order fulfillment or decline it with your feedback.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setRejectModalOrder(po)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition cursor-pointer"
                        >
                          Reject Quote ✕
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptQuote(po.id)}
                          disabled={actionLoading}
                          className="px-4 py-1.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-black transition shadow-xs cursor-pointer"
                        >
                          Accept Quotation ✓
                        </button>
                      </div>
                    </div>
                  )}

                  {/* If Rejected by School, display reason */}
                  {po.status === 'Rejected by School' && po.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-800">
                      <strong>Reason for Declining Quotation:</strong> {po.rejection_reason}
                    </div>
                  )}

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
                        type="button"
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
                  type="button"
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

        {/* Rejection Modal */}
        {rejectModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="bg-[#EFE3D3] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#8A7968]/40 shadow-2xl space-y-4">
              <div>
                <h3 className="text-lg font-black text-[#2B2B2B]">Decline Official Quotation</h3>
                <p className="text-xs text-[#8A7968] mt-0.5">
                  Tracking ID: <strong>{rejectModalOrder.tracking_id}</strong>
                </p>
              </div>

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-[#2B2B2B]">
                    Reason for Rejection *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Pricing exceeds lab budget, item specification changes needed, etc..."
                    className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectModalOrder(null)
                      setRejectionReason('')
                    }}
                    className="px-4 py-2 rounded-xl border border-[#8A7968]/30 bg-[#F4EADE] hover:bg-[#EADBC8] text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition shadow-xs cursor-pointer"
                  >
                    {actionLoading ? 'Submitting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}