// app/track/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'

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
      setErrorMsg('Please enter a valid tracking ID.')
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
      setTrackingIdInput(initialId)
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
    <div className="min-h-screen bg-[#F4EADE] text-[#2B2B2B] pb-24 sm:pb-16 w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-[#EFE3D3] border-b border-[#8A7968]/30 px-4 sm:px-6 py-3.5 sm:py-4 mb-6 sm:mb-8 shadow-xs w-full">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <Link href="/" className="truncate">
            <h1 className="text-base sm:text-xl font-black text-[#2B2B2B] truncate">Mahin's One-Stop One-Store</h1>
          </Link>
          <Link href="/" className="text-xs font-bold text-[#B76E79] hover:underline shrink-0 whitespace-nowrap">
            Return to Store
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 w-full">
        <div className="mb-4">
          <Link href="/orders" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2B2B2B] bg-[#EFE3D3] hover:bg-[#EADBC8] px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-[#8A7968]/30 transition">
            ← Back to Order History
          </Link>
        </div>

        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-[#2B2B2B] mb-1 sm:mb-2">Track Your Shipment 📦</h2>
          <p className="text-xs text-[#8A7968]">Enter your tracking ID to see live progress and order details</p>
        </div>

        {/* Tracking Input Bar */}
        <div className="bg-[#EFE3D3] p-2.5 sm:p-4 rounded-2xl shadow-xs border border-[#8A7968]/30 flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-6 sm:mb-8 w-full">
          <input
            type="text"
            value={trackingIdInput}
            onChange={(e) => setTrackingIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchTracking()}
            placeholder="Enter Tracking ID..."
            className="w-full sm:flex-1 border border-[#8A7968]/40 p-3 rounded-xl text-xs sm:text-sm font-mono text-[#2B2B2B] bg-[#F4EADE] placeholder:text-[#8A7968] focus:border-[#B76E79] focus:outline-hidden min-w-0"
          />
          <button
            onClick={() => handleSearchTracking()}
            disabled={loading}
            className="w-full sm:w-auto bg-[#B76E79] hover:bg-[#9E5B65] text-white font-extrabold px-5 sm:px-6 py-3 rounded-xl text-xs sm:text-sm shadow-xs transition disabled:opacity-50 cursor-pointer whitespace-nowrap btn-press shrink-0"
          >
            {loading ? 'Searching...' : 'Track Order 🔍'}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 sm:p-4 bg-red-100 text-red-700 rounded-xl text-xs font-semibold border border-red-200 mb-6 text-center">
            {errorMsg}
          </div>
        )}

        {order && (
          <div className="bg-[#EFE3D3] rounded-2xl sm:rounded-3xl shadow-xs border border-[#8A7968]/30 p-4 sm:p-8 space-y-6 sm:space-y-8 w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-[#8A7968]/20 pb-4 sm:pb-6 gap-2 sm:gap-4">
              <div>
                <span className="text-[10px] sm:text-[11px] font-extrabold text-[#B76E79] uppercase tracking-wider block mb-0.5">Tracking ID</span>
                <span className="text-base sm:text-xl font-mono font-black text-[#2B2B2B] break-all">{order.tracking_id}</span>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-[#8A7968] uppercase tracking-wider block mb-0.5">Placed On</span>
                <span className="text-xs font-bold text-[#2B2B2B]">{order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-extrabold text-[#2B2B2B] uppercase tracking-wider mb-6">Shipment Progress</h3>
              
              {(() => {
                const { steps, activeIndex, isCancelled } = getTimelineSteps(order)

                if (isCancelled) {
                  return (
                    <div className="bg-red-50 p-4 sm:p-5 rounded-2xl border border-red-200 text-center text-red-700">
                      <span className="text-2xl block mb-1">✕</span>
                      <span className="text-sm font-bold uppercase tracking-wider block">Order Cancelled / Rejected</span>
                      <p className="text-xs text-red-600 mt-1">{order.cancellation_reason || 'This order was cancelled.'}</p>
                    </div>
                  )
                }

                return (
                  <div className="relative flex items-center justify-between max-w-xl mx-auto px-2 sm:px-4 py-2">
                    <div className="absolute left-6 right-6 sm:left-12 sm:right-12 top-4 h-1 bg-[#8A7968]/30 z-0">
                      <div className="h-full bg-green-600 transition-all duration-500" style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }} />
                    </div>

                    {steps.map((step, idx) => {
                      const isComplete = idx <= activeIndex
                      return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs shadow-xs transition-all ${
                            isComplete ? 'bg-green-600 text-white ring-4 ring-green-600/20' : 'bg-[#EADBC8] text-[#8A7968]'
                          }`}>
                            {isComplete ? '✓' : idx + 1}
                          </div>
                          <span className={`text-[9px] sm:text-[11px] font-bold mt-2 text-center max-w-[70px] sm:max-w-[90px] leading-tight ${isComplete ? 'text-[#2B2B2B]' : 'text-[#8A7968]'}`}>
                            {step.label}
                          </span>
                          <span className="text-[8px] sm:text-[10px] font-medium text-[#8A7968] mt-0.5 text-center max-w-[70px] sm:max-w-[90px]">
                            {isComplete ? step.time : 'Pending'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              <div className="mt-6 sm:mt-8 text-center">
                <span className="text-xs font-bold text-[#8A7968]">Current Status: </span>
                <span className="text-xs font-black uppercase text-[#B76E79] bg-[#B76E79]/15 px-3 py-1 rounded-full border border-[#B76E79]/30 inline-block ml-1">
                  {order.status || 'Pending'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-[#EADBC8]/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#8A7968]/30">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#8A7968] uppercase block mb-1">Payment Method</span>
                <span className="text-xs font-mono font-bold text-[#2B2B2B] break-words">{order.payment_method || 'Online'}</span>
              </div>
              <div className="bg-[#EADBC8]/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#8A7968]/30">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#8A7968] uppercase block mb-1">Customer Name</span>
                <span className="text-xs font-bold text-[#2B2B2B]">{order.customer_name}</span>
              </div>
            </div>

            <div className="bg-[#EADBC8]/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#8A7968]/30">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#8A7968] uppercase block mb-1">Shipping Address</span>
              <p className="text-xs font-medium text-[#2B2B2B] leading-relaxed break-words">{order.shipping_address}</p>
            </div>

            {/* Items Ordered List */}
            <div>
              <h3 className="text-xs font-extrabold text-[#2B2B2B] uppercase tracking-wider mb-3">Items Ordered</h3>
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
                    <div key={idx} className="bg-[#EADBC8]/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#8A7968]/30 space-y-2.5 sm:space-y-3">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <img 
                          src={displayImg} 
                          alt="" 
                          className="w-12 h-12 object-cover rounded-xl border border-[#8A7968]/30 bg-[#F4EADE] shrink-0 cursor-pointer hover:opacity-80 transition mt-0.5"
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
                            className="text-xs font-bold text-[#2B2B2B] hover:text-[#B76E79] hover:underline text-left block w-full whitespace-normal break-words cursor-pointer leading-relaxed"
                          >
                            {displayName}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-[#8A7968]/20 pt-2 text-[#8A7968] font-semibold">
                        <span>₹{unitPrice} × {qty} units</span>
                        <span className="font-black text-[#2B2B2B] text-sm">₹{unitPrice * qty}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-between items-center border-t border-[#8A7968]/20 mt-4 pt-4 text-sm font-black text-[#2B2B2B]">
                <span>Total Amount</span>
                <span>₹{order.total_amount || order.final_payable_amount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Image Product Details Modal */}
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
                  <h3 className="text-lg sm:text-xl font-black text-[#2B2B2B] mt-1 mb-1.5">{selectedProductModal.name || selectedProductModal.title}</h3>
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

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4EADE] flex items-center justify-center text-[#8A7968] font-bold">Loading tracker...</div>}>
      <TrackContent />
    </Suspense>
  )
}