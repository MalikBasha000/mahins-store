// app/track/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function TrackContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const initialId = searchParams.get('id') || ''

  const [trackingIdInput, setTrackingIdInput] = useState(initialId)
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedProductModal, setSelectedProductModal] = useState<any | null>(null)
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0)
  const [liveProductsMap, setLiveProductsMap] = useState<Record<string, any>>({})

  const handleSearchTracking = async (idToSearch?: string) => {
    const queryId = (idToSearch || trackingIdInput).trim()
    if (!queryId) {
      setErrorMsg('Please enter a valid 16-digit tracking ID.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setOrder(null)

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_id', queryId)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        setErrorMsg('No order found with this tracking ID. Please check and try again.')
      } else {
        setOrder(data)
        if (data.items && Array.isArray(data.items)) {
          const prodMap: Record<string, any> = {}
          for (const item of data.items) {
            const pId = item.id || item.product_id
            if (pId) {
              const { data: liveProd } = await supabase.from('products').select('*').eq('id', pId).maybeSingle()
              if (liveProd) prodMap[pId] = liveProd
            }
          }
          setLiveProductsMap(prodMap)
        }
      }
    } catch (err: any) {
      setErrorMsg(`Error fetching order: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialId) {
      handleSearchTracking(initialId)
    }
  }, [initialId])

  const getTimelineSteps = (orderData: any) => {
    const status = (orderData?.status || 'Pending').toLowerCase()
    const createdAt = orderData?.created_at ? new Date(orderData.created_at) : new Date()

    const addMinutes = (date: Date, mins: number) => new Date(date.getTime() + mins * 60000)

    const placedTime = createdAt.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const verifiedTime = addMinutes(createdAt, 15).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const shippedTime = addMinutes(createdAt, 120).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const deliveredTime = addMinutes(createdAt, 1440).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

    const steps = [
      { label: 'Order Placed', key: 'pending', time: placedTime },
      { label: 'Payment Verified', key: 'processing', time: verifiedTime },
      { label: 'Packed & Dispatched', key: 'shipped', time: shippedTime },
      { label: 'Delivered', key: 'delivered', time: deliveredTime }
    ]

    let activeIndex = 0
    if (status.includes('processing') || status.includes('verified')) activeIndex = 1
    if (status.includes('shipped')) activeIndex = 2
    if (status.includes('delivered')) activeIndex = 3
    if (status.includes('cancelled')) activeIndex = -1

    return { steps, activeIndex, isCancelled: status.includes('cancelled') }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white border-b border-gray-200 px-6 py-4 mb-8 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-indigo-950">Mahin's One-Stop One-Store</h1>
          <Link href="/" className="text-xs font-bold text-indigo-600 hover:underline">
            Return to Store
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-4">
          <Link href="/orders" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3.5 py-2 rounded-xl border border-indigo-200 transition">
            ← Back to Order History
          </Link>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-indigo-950 mb-2">Track Your Shipment 📦</h2>
          <p className="text-xs text-gray-500">Enter your 16-digit tracking ID to see live progress and order details</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex gap-3 mb-8">
          <input
            type="text"
            value={trackingIdInput}
            onChange={(e) => setTrackingIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchTracking()}
            placeholder="Enter 16-digit Tracking ID..."
            className="flex-1 border border-gray-300 p-3 rounded-xl text-sm font-mono text-gray-900 bg-white focus:outline-indigo-600"
          />
          <button
            onClick={() => handleSearchTracking()}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-3 rounded-xl text-sm shadow-md transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'Track Order 🔍'}
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-100 text-red-700 rounded-xl text-xs font-semibold border border-red-200 mb-6 text-center">
            {errorMsg}
          </div>
        )}

        {order && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-8">
            <div className="flex flex-wrap justify-between items-center border-b pb-6 gap-4">
              <div>
                <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider block mb-1">Tracking ID</span>
                <span className="text-xl font-mono font-black text-indigo-950">{order.tracking_id}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">Placed On</span>
                <span className="text-xs font-bold text-gray-700">{order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-6">Shipment Progress</h3>
              
              {(() => {
                const { steps, activeIndex, isCancelled } = getTimelineSteps(order)

                if (isCancelled) {
                  return (
                    <div className="bg-red-50 p-5 rounded-2xl border border-red-200 text-center text-red-700">
                      <span className="text-2xl block mb-1">✕</span>
                      <span className="text-sm font-bold uppercase tracking-wider block">Order Cancelled / Rejected</span>
                      <p className="text-xs text-red-600 mt-1">{order.cancellation_reason || 'This order was cancelled.'}</p>
                    </div>
                  )
                }

                return (
                  <div className="relative flex items-center justify-between max-w-xl mx-auto px-4 py-2">
                    <div className="absolute left-12 right-12 top-4 h-1 bg-gray-200 z-0">
                      <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }} />
                    </div>

                    {steps.map((step, idx) => {
                      const isComplete = idx <= activeIndex
                      return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-all ${
                            isComplete ? 'bg-green-600 text-white ring-4 ring-green-100' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {isComplete ? '✓' : idx + 1}
                          </div>
                          <span className={`text-[11px] font-bold mt-2 text-center max-w-[90px] ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.label}
                          </span>
                          <span className="text-[10px] font-medium text-gray-400 mt-0.5 text-center max-w-[90px]">
                            {isComplete ? step.time : 'Pending'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              <div className="mt-8 text-center">
                <span className="text-xs font-bold text-gray-500">Current Status: </span>
                <span className="text-xs font-black uppercase text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 inline-block ml-1">
                  {order.status || 'Pending'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <span className="text-[11px] font-bold text-gray-400 uppercase block mb-1">Payment Method</span>
                <span className="text-xs font-mono font-bold text-gray-900">{order.payment_method || 'Online'}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <span className="text-[11px] font-bold text-gray-400 uppercase block mb-1">Customer Name</span>
                <span className="text-xs font-bold text-gray-900">{order.customer_name}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <span className="text-[11px] font-bold text-gray-400 uppercase block mb-1">Shipping Address</span>
              <p className="text-xs font-medium text-gray-800 leading-relaxed">{order.shipping_address}</p>
            </div>

            {/* Items Ordered List with Proper Block Stacking to Prevent Overlap */}
            <div>
              <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-3">Items Ordered</h3>
              <div className="space-y-3">
                {Array.isArray(order.items) && order.items.map((item: any, idx: number) => {
                  const pId = item.id || item.product_id
                  const liveProd = liveProductsMap[pId]
                  
                  const displayName = liveProd ? (liveProd.name || liveProd.title) : item.name
                  const displayImg = liveProd?.image_url 
                    ? liveProd.image_url.split(',')[0].trim() 
                    : (item.image_url ? item.image_url.split(',')[0].trim() : 'https://via.placeholder.com/50')
                  
                  const unitPrice = Number(liveProd?.price ?? item.price) || 0
                  const qty = Number(item.quantity) || 1

                  return (
                    <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                      <div className="flex items-start gap-4">
                        <img 
                          src={displayImg} 
                          alt="" 
                          className="w-12 h-12 object-cover rounded-xl border bg-white flex-shrink-0 cursor-pointer hover:opacity-80 transition mt-0.5"
                          onClick={() => {
                            if (liveProd) {
                              setSelectedProductModal(liveProd)
                            } else {
                              setSelectedProductModal({ name: displayName, price: unitPrice, description: 'No description.', image_url: displayImg })
                            }
                            setActiveModalImageIndex(0)
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <button 
                            onClick={() => {
                              if (liveProd) {
                                setSelectedProductModal(liveProd)
                              } else {
                                setSelectedProductModal({ name: displayName, price: unitPrice, description: 'No description.', image_url: displayImg })
                              }
                              setActiveModalImageIndex(0)
                            }}
                            className="text-xs font-bold text-indigo-900 hover:text-indigo-600 hover:underline text-left block w-full whitespace-normal break-words cursor-pointer leading-relaxed"
                          >
                            {displayName}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t pt-2 text-gray-600 font-semibold">
                        <span>₹{unitPrice} × {qty} units</span>
                        <span className="font-black text-indigo-950 text-sm">₹{unitPrice * qty}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-between items-center border-t mt-4 pt-4 text-sm font-black text-indigo-950">
                <span>Total Amount Paid</span>
                <span>₹{order.total_amount || order.final_payable_amount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Image Product Details Modal */}
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

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading tracker...</div>}>
      <TrackContent />
    </Suspense>
  )
}