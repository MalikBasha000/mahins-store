// app/orders/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'
import OrderInvoiceModal from '../admin/OrderInvoiceModal'

export default function CustomerOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatusTab, setActiveStatusTab] = useState('ALL')
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<any | null>(null)
  const [selectedProductModal, setSelectedProductModal] = useState<any | null>(null)
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0)
  const [liveProductsMap, setLiveProductsMap] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchCustomerOrders()
  }, [])

  const fetchCustomerOrders = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setLoading(false)
        return
      }

      const userId = session.user.id
      const email = session.user.email || ''

      const res = await fetch(`/api/customer-orders?userId=${userId}&email=${encodeURIComponent(email)}`)
      const data = await res.json()

      if (data.success && data.orders) {
        setOrders(data.orders)
        
        const prodMap: Record<string, any> = {}
        for (const order of data.orders) {
          if (order.items && Array.isArray(order.items)) {
            for (const item of order.items) {
              const pId = item.id || item.product_id
              if (pId && !prodMap[pId]) {
                const { data: liveProd } = await supabase.from('products').select('*').eq('id', pId).maybeSingle()
                if (liveProd) prodMap[pId] = liveProd
              }
            }
          }
        }
        setLiveProductsMap(prodMap)
      }
    } catch (err) {
      console.error('Failed to fetch customer orders:', err)
    }
    setLoading(false)
  }

  const handleCancelOrder = async (order: any) => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation.')
      return
    }

    const formattedReason = `Customer cancelled due to: ${cancelReason.trim()}`

    const { error: updateErr } = await supabase
      .from('orders')
      .update({ 
        status: 'Cancelled',
        cancellation_reason: formattedReason
      })
      .eq('id', order.id)

    if (updateErr) {
      alert(`Failed to cancel order: ${updateErr.message}`)
      return
    }

    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const prodId = item.id || item.product_id
        const qty = item.quantity || 1

        const { data: currentProd } = await supabase
          .from('products')
          .select('stock')
          .eq('id', prodId)
          .single()

        if (currentProd) {
          const restoredStock = currentProd.stock + qty
          await supabase
            .from('products')
            .update({ stock: restoredStock, updated_at: new Date().toISOString() })
            .eq('id', prodId)
        }
      }
    }

    setCancellingOrderId(null)
    setCancelReason('')
    fetchCustomerOrders()
    alert('Order successfully cancelled and stock restored.')
  }

  const filteredOrders = orders.filter(order => {
    if (activeStatusTab === 'ALL') return true
    const status = (order.status || 'Pending').toUpperCase()
    if (activeStatusTab === 'PENDING') return status === 'PENDING' || status === 'PENDING VERIFICATION'
    return status === activeStatusTab.toUpperCase()
  })

  const getCount = (status: string) => {
    if (status === 'ALL') return orders.length
    if (status === 'PENDING') return orders.filter(o => {
      const s = (o.status || 'Pending').toUpperCase()
      return s === 'PENDING' || s === 'PENDING VERIFICATION'
    }).length
    return orders.filter(o => (o.status || 'Pending').toUpperCase() === status.toUpperCase()).length
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F4EADE] text-[#8A7968] font-bold">Loading your orders...</div>
  }

  return (
    <div className="min-h-screen bg-[#F4EADE] text-[#2B2B2B] p-4 sm:p-8 w-full overflow-x-hidden">
      <div className="mx-auto max-w-4xl rounded-2xl sm:rounded-3xl bg-[#EFE3D3] p-4 sm:p-8 shadow-xs border border-[#8A7968]/30">
        <div className="text-center mb-6 pb-4 border-b border-[#8A7968]/20">
          <h1 className="text-xl sm:text-2xl font-black text-[#2B2B2B]">Mahin's One-Stop One-Store</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
          <Link href="/" className="text-xs sm:text-sm font-semibold text-[#B76E79] hover:underline">← Return to Store</Link>
          <h2 className="text-lg sm:text-xl font-bold text-[#2B2B2B]">Your Order History</h2>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8 border-b border-[#8A7968]/20 pb-4">
          {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => {
            const count = getCount(status)
            return (
              <button
                key={status}
                onClick={() => setActiveStatusTab(status)}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                  activeStatusTab === status
                    ? 'bg-[#B76E79] text-white shadow-xs'
                    : 'bg-[#EADBC8] text-[#2B2B2B] hover:bg-[#8A7968]/30 border border-[#8A7968]/30'
                }`}
              >
                {status} <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeStatusTab === status ? 'bg-[#9E5B65] text-white' : 'bg-[#F4EADE] text-[#2B2B2B]'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-[#8A7968]">
            <p className="text-base sm:text-lg mb-4">No orders found under "{activeStatusTab}" status.</p>
            <button onClick={() => setActiveStatusTab('ALL')} className="text-xs font-bold text-[#B76E79] underline cursor-pointer">
              View All Orders
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const isCancellable = order.status === 'Pending' || order.status === 'Processing' || order.status === 'Pending Verification'
              const isDelivered = (order.status || '').toLowerCase() === 'delivered'

              return (
                <div key={order.id} className="border border-[#8A7968]/30 rounded-2xl p-4 sm:p-6 bg-[#EADBC8]/40 shadow-2xs">
                  <div className="flex flex-wrap justify-between items-center border-b border-[#8A7968]/20 pb-4 mb-4 gap-2">
                    <div>
                      <span className="text-[10px] sm:text-xs text-[#8A7968] block">16-Digit Tracking ID</span>
                      <span className="font-mono text-xs sm:text-sm font-black text-[#2B2B2B] tracking-wider break-all">
                        {order.tracking_id || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs text-[#8A7968] block">Order Status</span>
                      <span className={`inline-block mt-0.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-extrabold uppercase border ${
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                        order.status === 'Delivered' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-[#B76E79]/20 text-[#B76E79] border-[#B76E79]/30'
                      }`}>
                        {order.status || 'Pending'}
                      </span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] sm:text-xs text-[#8A7968] block">Placed On</span>
                      <span className="text-xs font-bold text-[#2B2B2B]">
                        {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {order.cancellation_reason && (
                    <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-700">
                      <span className="font-bold">Cancellation Reason:</span> {order.cancellation_reason}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-3 sm:gap-4 text-xs mb-4">
                    <div className="bg-[#F4EADE] p-3 rounded-xl border border-[#8A7968]/30">
                      <span className="font-bold text-[#8A7968] block mb-1">Payment Method</span>
                      <span className="font-semibold text-[#2B2B2B] break-words">{order.payment_method || 'Cash on Delivery'}</span>
                    </div>
                    <div className="bg-[#F4EADE] p-3 rounded-xl border border-[#8A7968]/30">
                      <span className="font-bold text-[#8A7968] block mb-1">Shipping Address</span>
                      <span className="text-[#2B2B2B] truncate block">{order.shipping_address}</span>
                    </div>
                  </div>

                  {/* Items Ordered */}
                  <div className="bg-[#F4EADE] p-3 sm:p-4 rounded-xl border border-[#8A7968]/30">
                    <h4 className="text-xs font-bold text-[#8A7968] uppercase mb-3">Items Ordered</h4>
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {Array.isArray(order.items) && order.items.map((item: any, idx: number) => {
                        const pId = item.id || item.product_id
                        const liveProd = liveProductsMap[pId]
                        
                        const displayName = liveProd ? (liveProd.name || liveProd.title) : item.name
                        const displayImg = liveProd?.image_url 
                          ? liveProd.image_url.split(',')[0].trim() 
                          : (item.image_url ? item.image_url.split(',')[0].trim() : 'https://via.placeholder.com/40')
                        
                        const unitPrice = Number(liveProd?.price ?? item.price) || 0
                        const qty = Number(item.quantity) || 1
                        const lineTotal = unitPrice * qty

                        return (
                          <div key={idx} className="flex items-center justify-between text-xs border-b border-[#8A7968]/20 pb-3 gap-3 overflow-hidden">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <img 
                                src={displayImg} 
                                alt="" 
                                className="w-11 h-11 object-contain p-1 rounded-xl border border-[#8A7968]/30 bg-[#EADBC8]/40 shrink-0 cursor-pointer hover:opacity-80 transition"
                                onClick={() => {
                                  if (liveProd) {
                                    setSelectedProductModal(liveProd)
                                  } else {
                                    setSelectedProductModal({ name: displayName, price: unitPrice, description: 'No description.', image_url: displayImg })
                                  }
                                  setActiveModalImageIndex(0)
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <button 
                                  onClick={() => {
                                    if (liveProd) {
                                      setSelectedProductModal(liveProd)
                                    } else {
                                      setSelectedProductModal({ name: displayName, price: unitPrice, description: 'No description.', image_url: displayImg })
                                    }
                                    setActiveModalImageIndex(0)
                                  }}
                                  className="text-[#2B2B2B] font-bold hover:text-[#B76E79] hover:underline text-left block truncate w-full cursor-pointer"
                                  title={displayName}
                                >
                                  {displayName}
                                </button>
                                <span className="text-[#8A7968] block mt-0.5">₹{unitPrice} per unit × {qty}</span>
                              </div>
                            </div>
                            <span className="font-bold text-[#2B2B2B] whitespace-nowrap shrink-0">₹{lineTotal}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-2 border-t border-[#8A7968]/20 font-bold text-xs sm:text-sm text-[#2B2B2B]">
                      <span>Total Amount:</span>
                      <span className="text-[#2B2B2B] text-sm sm:text-base font-black">₹{order.total_amount || order.final_payable_amount}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    {isCancellable && (
                      <div>
                        {cancellingOrderId === order.id ? (
                          <div className="flex flex-col gap-2 bg-[#F4EADE] p-3 rounded-xl border border-[#8A7968]/30 shadow-2xs">
                            <input
                              type="text"
                              placeholder="State reason for cancellation..."
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              className="border border-[#8A7968]/40 bg-[#EFE3D3] p-2 rounded-lg text-xs w-full sm:w-64 text-[#2B2B2B] focus:outline-[#B76E79]"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCancelOrder(order)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer btn-press"
                              >
                                Confirm Cancellation
                              </button>
                              <button
                                onClick={() => { setCancellingOrderId(null); setCancelReason(''); }}
                                className="bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                Back
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCancellingOrderId(order.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3.5 py-2 rounded-xl transition border border-red-200 cursor-pointer btn-press"
                          >
                            Cancel Order ✕
                          </button>
                        )}
                      </div>
                    )}

                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      {isDelivered && (
                        <button
                          onClick={() => setActiveInvoiceOrder(order)}
                          className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer btn-press"
                        >
                          📄 Download / Print Invoice
                        </button>
                      )}

                      <Link 
                        href={`/track?id=${order.tracking_id}`}
                        className="bg-[#B76E79] hover:bg-[#9E5B65] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 btn-press"
                      >
                        Track Live Shipment 📦
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {activeInvoiceOrder && (
        <OrderInvoiceModal
          order={activeInvoiceOrder}
          type="INVOICE"
          onClose={() => setActiveInvoiceOrder(null)}
        />
      )}

      {/* Product Details Modal */}
      {selectedProductModal && (
        <div className="fixed inset-0 bg-[#2B2B2B]/85 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-fade-in" onClick={() => setSelectedProductModal(null)}>
          <div className="bg-[#EFE3D3] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#8A7968]/40 w-full max-w-2xl p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedProductModal(null)} 
              className="absolute right-3 top-3 sm:right-4 sm:top-4 text-[#8A7968] hover:text-[#2B2B2B] font-bold text-sm bg-[#EADBC8] border border-[#8A7968]/30 px-3 py-1 rounded-full cursor-pointer"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-0">
              <div>
                <div className="bg-[#EADBC8]/60 rounded-xl sm:rounded-2xl overflow-hidden border border-[#8A7968]/30 h-56 sm:h-72 flex items-center justify-center mb-3">
                  <img 
                    src={
                      selectedProductModal.image_url 
                        ? selectedProductModal.image_url.split(',')[activeModalImageIndex]?.trim() || selectedProductModal.image_url.split(',')[0].trim()
                        : 'https://via.placeholder.com/300'
                    } 
                    alt="" 
                    className="w-full h-full object-contain p-2" 
                  />
                </div>
                {selectedProductModal.image_url && selectedProductModal.image_url.split(',').length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {selectedProductModal.image_url.split(',').map((url: string, i: number) => {
                      const clean = url.trim()
                      return (
                        <button
                          key={i}
                          onClick={() => setActiveModalImageIndex(i)}
                          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 shrink-0 transition bg-[#F4EADE] ${
                            activeModalImageIndex === i ? 'border-[#B76E79] scale-105 shadow-xs' : 'border-[#8A7968]/40 opacity-60'
                          }`}
                        >
                          <img src={clean} alt="" className="w-full h-full object-cover" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-[10px] sm:text-xs text-[#B76E79] font-bold uppercase tracking-wider">{selectedProductModal.category || 'Electronics & Robotics'}</span>
                  <h3 className="text-lg sm:text-xl font-black text-[#2B2B2B] mt-1 mb-2">{selectedProductModal.name || selectedProductModal.title}</h3>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#2B2B2B] mb-3 sm:mb-4">₹{selectedProductModal.price}</div>
                  <div className="text-xs text-[#8A7968] space-y-2 leading-relaxed max-h-40 sm:max-h-48 overflow-y-auto">
                    <p>{selectedProductModal.description || 'High quality hardware component for student and lab projects.'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProductModal(null)}
                  className="w-full mt-4 sm:mt-6 bg-[#EADBC8] hover:bg-[#8A7968]/30 border border-[#8A7968]/30 text-[#2B2B2B] font-bold py-2.5 rounded-xl text-xs transition cursor-pointer btn-press"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}