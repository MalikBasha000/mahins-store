// app/track/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function TrackPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const initialId = searchParams.get('id') || ''

  const [trackingId, setTrackingId] = useState(initialId)
  const [order, setOrder] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (initialId) {
      handleSearch(initialId)
    }
  }, [initialId])

  const handleSearch = async (idToSearch: string) => {
    if (!idToSearch.trim()) return
    setLoading(true)
    setErrorMsg('')
    setOrder(null)

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('tracking_id', idToSearch.trim())
      .single()

    if (error || !data) {
      setErrorMsg('No order found with this 16-digit tracking ID. Please check and try again.')
    } else {
      setOrder(data)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-md">
        <div className="text-center mb-6 pb-4 border-b">
          <h1 className="text-2xl font-black text-indigo-900">Mahin's One-Stop One-Store</h1>
        </div>

        <div className="flex justify-between items-center mb-6">
          <Link href="/orders" className="text-sm text-indigo-600 hover:underline">← Back to Order History</Link>
          <h2 className="text-xl font-bold text-gray-900">Live Shipment Tracker</h2>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter 16-digit tracking ID..."
            className="w-full border border-gray-300 p-3 rounded-xl text-sm font-mono text-gray-900 focus:outline-indigo-600"
          />
          <button
            onClick={() => handleSearch(trackingId)}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </div>

        {errorMsg && <div className="p-4 bg-red-100 text-red-700 rounded-xl text-xs font-semibold mb-6">{errorMsg}</div>}

        {order && (
          <div className="border rounded-2xl p-6 bg-gray-50/50 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <span className="text-xs text-gray-500 block">Tracking ID</span>
                <span className="font-mono text-sm font-black text-indigo-900">{order.tracking_id}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 block">Status</span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase mt-1 ${
                  order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                  order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>

            {/* If order is Cancelled, show cancellation reason banner instead of shipment tracker */}
            {order.status === 'Cancelled' ? (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center space-y-2">
                <div className="text-3xl">❌</div>
                <h3 className="text-base font-black text-red-900">Order Cancelled</h3>
                <p className="text-sm font-bold text-red-700 bg-white p-3 rounded-lg border border-red-200 inline-block w-full">
                  {order.cancellation_reason || 'This order was cancelled.'}
                </p>
                <p className="text-xs text-gray-500 mt-2">Inventory stock has been automatically restored for this order.</p>
              </div>
            ) : (
              /* Active Shipment Tracker Steps */
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase">Shipment Progress</h3>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className={`p-3 rounded-xl border font-bold ${['Pending', 'Processing', 'Shipped', 'Delivered'].includes(order.status) ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-gray-400'}`}>
                    1. Pending
                  </div>
                  <div className={`p-3 rounded-xl border font-bold ${['Processing', 'Shipped', 'Delivered'].includes(order.status) ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-gray-400'}`}>
                    2. Processing
                  </div>
                  <div className={`p-3 rounded-xl border font-bold ${['Shipped', 'Delivered'].includes(order.status) ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-gray-400'}`}>
                    3. Shipped
                  </div>
                  <div className={`p-3 rounded-xl border font-bold ${order.status === 'Delivered' ? 'bg-green-600 text-white border-green-600 shadow' : 'bg-white text-gray-400'}`}>
                    4. Delivered
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded-xl border text-xs space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-gray-500">Customer Name:</span>
                <span className="font-semibold text-gray-900">{order.customer_name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-gray-500">Total Amount:</span>
                <span className="font-bold text-indigo-600">₹{order.total_amount || order.final_payable_amount}</span>
              </div>
              <div>
                <span className="font-bold text-gray-500 block mb-1">Shipping Address:</span>
                <span className="text-gray-800 leading-relaxed block">{order.shipping_address}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}