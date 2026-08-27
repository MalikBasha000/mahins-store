// app/orders/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'
import CustomerInvoiceModal from '../components/CustomerInvoiceModal'

export default function CustomerOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatusTab, setActiveStatusTab] = useState('ALL')
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<any | null>(null)

  useEffect(() => {
    fetchCustomerOrders()
  }, [])

  const fetchCustomerOrders = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setOrders(data)
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
    return (order.status || 'Pending').toUpperCase() === activeStatusTab.toUpperCase()
  })

  const getCount = (status: string) => {
    if (status === 'ALL') return orders.length
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
              const isCancellable = order.status === 'Pending' || order.status === 'Processing'
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

                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Items Ordered</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {Array.isArray(order.items) && order.items.map((item: any, idx: number) => {
                        const unitPrice = item.price || 0
                        const qty = item.quantity || 1
                        const lineTotal = unitPrice * qty
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs border-b pb-2">
                            <div>
                              <span className="text-gray-900 font-bold block">{item.name}</span>
                              <span className="text-gray-500">₹{unitPrice} per unit × {qty}</span>
                            </div>
                            <span className="font-bold text-gray-900">₹{lineTotal}</span>
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
                      {/* Delivered: Official Invoice Download */}
                      {isDelivered && (
                        <button
                          onClick={() => setActiveInvoiceOrder(order)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer"
                        >
                          📄 Download Invoice
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

      {/* Customer Invoice Modal */}
      {activeInvoiceOrder && (
        <CustomerInvoiceModal
          order={activeInvoiceOrder}
          onClose={() => setActiveInvoiceOrder(null)}
        />
      )}
    </div>
  )
}