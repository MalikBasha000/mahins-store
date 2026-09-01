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
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const userEmail = (user.email || '').trim().toLowerCase()

      // Fetch orders matching user_id OR customer_email to sync past guest orders
      const { data } = await supabase
        .from('orders')
        .select('*')
        .or(`user_id.eq.${user.id},customer_email.ilike.${userEmail}`)
        .order('created_at', { ascending: false })

      if (data) {
        setOrders(data)
        
        // Automatically claim unclaimed guest orders matching this email
        const unclaimed = data.filter(o => !o.user_id)
        if (unclaimed.length > 0) {
          await supabase
            .from('orders')
            .update({ user_id: user.id })
            .in('id', unclaimed.map(o => o.id))
        }
        
        // Fetch live product details to sync updated names and images dynamically
        const prodMap: Record<string, any> = {}
        for (const order of data) {
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
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading your orders...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 sm:p-8 shadow-md">
        <div className="text-center mb-6 pb-4 border-b">
          <h1 className="text-2xl font-black text-indigo-900">Mahin's One-Stop One-Store</h1>
        </div>

        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline">← Return to Store</Link>
          <h2 className="text-xl font-bold text-gray-900">Your Order History</h2>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b pb-4">
          {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => {
            const count = getCount(status)
            return (
              <button
                key={status}
                onClick={() => setActiveStatusTab(status)}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                  activeStatusTab === status
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status} <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeStatusTab === status ? 'bg-indigo-800 text-white' : 'bg-gray-200 text-gray-800'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-4">No orders found under "{activeStatusTab}" status.</p>
            <button onClick={() => setActiveStatusTab('ALL')} className="text-xs font-bold text-indigo-600 underline cursor-pointer">
              View All Orders
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const isCancellable = order.status === 'Pending' || order.status === 'Processing' || order.status === 'Pending Verification'
              const isDelivered = (order.status || '').toLowerCase() === 'delivered'

              return (
                <div key={order.id} className="border rounded-xl p-6 bg-gray-50/50 shadow-sm">
                  <div className="flex flex-wrap justify-between items-center border-b pb-4 mb-4 gap-2">
                    <div>
                      <span className="text-xs text-gray-500 block">16-Digit Tracking ID</span>
                      <span className="font-mono text-sm font-black text-indigo-900 tracking-wider">
                        {order.tracking_id || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Order Status</span>
                      <span className={`inline-block mt-0.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {order.status || 'Pending'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">Placed On</span>
                      <span className="text-xs font-bold text-gray-800">
                        {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {order.cancellation_reason && (
                    <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-lg text-xs text-red-700">
                      <span className="font-bold">Cancellation Reason:</span> {order.cancellation_reason}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 text-xs mb-4">
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="font-bold text-gray-500 block mb-1">Payment Method</span>
                      <span className="font-semibold text-gray-900">{order.payment_method || 'Cash on Delivery'}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="font-bold text-gray-500 block mb-1">Shipping Address</span>
                      <span className="text-gray-800 truncate block">{order.shipping_address}</span>
                    </div>
                  </div>

                  {/* Items Ordered with Live Product Syncing */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Items Ordered</h4>
                    <div className="space-y-3 max-h-56 overflow-y-auto">
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
                          <div key={idx} className="flex items-center justify-between text-xs border-b pb-3 gap-3 overflow-hidden">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <img 
                                src={displayImg} 
                                alt="" 
                                className="w-11 h-11 object-cover rounded-lg border bg-white flex-shrink-0 cursor-pointer hover:opacity-80 transition"
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
                                  className="text-gray-900 font-bold hover:text-indigo-600 hover:underline text-left block truncate w-full cursor-pointer"
                                  title={displayName}
                                >
                                  {displayName}
                                </button>
                                <span className="text-gray-500">₹{unitPrice} per unit × {qty}</span>
                              </div>
                            </div>
                            <span className="font-bold text-gray-900 whitespace-nowrap flex-shrink-0">₹{lineTotal}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-2 border-t font-bold text-sm text-gray-900">
                      <span>Total Amount:</span>
                      <span className="text-indigo-900 text-base font-black">₹{order.total_amount || order.final_payable_amount}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    {isCancellable && (
                      <div>
                        {cancellingOrderId === order.id ? (
                          <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border shadow-sm">
                            <input
                              type="text"
                              placeholder="State reason for cancellation..."
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              className="border p-2 rounded text-xs w-64 text-gray-900 focus:outline-indigo-600"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCancelOrder(order)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded transition cursor-pointer"
                              >
                                Confirm Cancellation
                              </button>
                              <button
                                onClick={() => { setCancellingOrderId(null); setCancelReason(''); }}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-3 py-1.5 rounded transition cursor-pointer"
                              >
                                Back
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCancellingOrderId(order.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-4 py-2 rounded-lg transition border border-red-200 cursor-pointer"
                          >
                            Cancel Order ✕
                          </button>
                        )}
                      </div>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                      {isDelivered && (
                        <button
                          onClick={() => setActiveInvoiceOrder(order)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer"
                        >
                          📄 Download / Print Invoice
                        </button>
                      )}

                      <Link 
                        href={`/track?id=${order.tracking_id}`}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition flex items-center gap-1.5"
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

      {/* Shared Invoice Modal */}
      {activeInvoiceOrder && (
        <OrderInvoiceModal
          order={activeInvoiceOrder}
          type="INVOICE"
          onClose={() => setActiveInvoiceOrder(null)}
        />
      )}

      {/* Product Details Pop-up Modal with Multi-Image Support */}
      {selectedProductModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedProductModal(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 font-bold text-lg bg-gray-100 px-3 py-1 rounded-full cursor-pointer"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="bg-gray-100 rounded-2xl overflow-hidden border h-72 flex items-center justify-center mb-3">
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
                {/* Thumbnails Picker */}
                {selectedProductModal.image_url && selectedProductModal.image_url.split(',').length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedProductModal.image_url.split(',').map((url: string, i: number) => {
                      const clean = url.trim()
                      return (
                        <button
                          key={i}
                          onClick={() => setActiveModalImageIndex(i)}
                          className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition bg-white ${
                            activeModalImageIndex === i ? 'border-indigo-600 scale-105 shadow-sm' : 'border-gray-200 opacity-60'
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
                  <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">{selectedProductModal.category || 'Electronics & Robotics'}</span>
                  <h3 className="text-xl font-black text-gray-900 mt-1 mb-2">{selectedProductModal.name || selectedProductModal.title}</h3>
                  <div className="text-2xl font-extrabold text-indigo-900 mb-4">₹{selectedProductModal.price}</div>
                  <div className="text-xs text-gray-600 space-y-2 leading-relaxed max-h-48 overflow-y-auto">
                    <p>{selectedProductModal.description || 'High quality hardware component for student and lab projects.'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProductModal(null)}
                  className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
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