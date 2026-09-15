// app/school-po/track/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import Link from 'next/link'

export default function SchoolPOTrackPage() {
  const [poReference, setPoReference] = useState('')
  const [result, setResult] = useState<any>(null)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [viewingProduct, setViewingProduct] = useState<any | null>(null)
  const supabase = createClient()

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = poReference.trim()
    if (!query) return

    setLoading(true)
    setSearched(true)
    setResult(null)

    const lowerQuery = query.toLowerCase()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query)
    const isPoCode = query.toUpperCase().startsWith('PO')

    let req = supabase.from('purchase_orders').select('*')

    if (isUuid) {
      req = req.eq('id', query)
    } else if (isPoCode) {
      req = req.ilike('tracking_id', query)
    } else {
      req = req.eq('email', lowerQuery)
    }

    const { data } = await req.order('created_at', { ascending: false }).limit(1)

    if (data && data.length > 0) {
      setResult(data[0])
    }
    setLoading(false)
  }

  const getTwelveDigitId = (id: string) => {
    if (!id) return '100000000000'
    let hash1 = 5381
    let hash2 = 52711
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i)
      hash1 = (hash1 * 33) ^ hash2
      hash2 = (hash2 * 33) ^ char
    }
    const combined = Math.abs(hash1).toString().padStart(6, '0') + Math.abs(hash2).toString().padStart(6, '0')
    return combined.slice(0, 12)
  }

  return (
    <div className="min-h-screen bg-[#F4EADE] text-[#2B2B2B] px-4 sm:px-8 py-8 sm:py-12 flex flex-col items-center">
      <div className="w-full max-w-xl bg-[#EFE3D3] p-6 sm:p-8 rounded-3xl border border-[#8A7968]/30 shadow-xs space-y-6">
        <div className="text-center space-y-1">
          <div className="text-3xl">🚚</div>
          <h1 className="text-xl sm:text-2xl font-black">Track Institutional PO / Quote</h1>
          <p className="text-xs text-[#8A7968]">
            Enter your 13-digit tracking ID (e.g. PO43324694093) or registered school email address.
          </p>
        </div>

        <form onSubmit={handleTrack} className="flex gap-2">
          <input
            type="text"
            required
            value={poReference}
            onChange={(e) => setPoReference(e.target.value)}
            placeholder="Enter PO43324694093 or email..."
            className="flex-1 border border-[#8A7968]/40 bg-[#F4EADE] p-3 rounded-xl text-xs text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden font-mono uppercase"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold text-xs px-5 rounded-xl transition cursor-pointer btn-press shrink-0"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {searched && !result && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl text-center font-bold">
            No matching purchase order found. Please check your tracking ID or school email.
          </div>
        )}

        {result && (
          <div className="bg-[#F4EADE] p-5 sm:p-6 rounded-3xl border border-[#8A7968]/30 space-y-4 text-xs shadow-xs">
            <div className="flex justify-between items-center border-b border-[#8A7968]/20 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-[#8A7968] uppercase block">13-Digit PO Tracking ID</span>
                <span className="font-mono text-sm font-black text-[#B76E79]">{result.tracking_id || `PO${result.id.replace(/-/g, '').slice(0, 11).toUpperCase()}`}</span>
              </div>
              <span className="bg-green-100 text-green-800 border border-green-200 font-black px-3 py-1 rounded-full uppercase text-[10px]">
                {result.status || 'Pending Review'}
              </span>
            </div>

            <div className="space-y-1 bg-[#EFE3D3] p-3.5 rounded-2xl border border-[#8A7968]/20">
              <div className="flex justify-between">
                <span className="font-bold text-[#8A7968]">Institution:</span>
                <span className="font-black text-[#2B2B2B]">{result.school_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[#8A7968]">Educator:</span>
                <span className="font-bold text-[#2B2B2B]">{result.educator_name} ({result.email})</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[#8A7968]">Total Estimate:</span>
                <span className="font-black text-sm text-[#B76E79]">₹{result.total_estimated_amount}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[#8A7968] uppercase text-[10px] block">Requested Items (Click to inspect):</span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {Array.isArray(result.items) && result.items.map((it: any, idx: number) => (
                  <div 
                    key={idx} 
                    onClick={() => setViewingProduct(it)}
                    className="flex justify-between items-center bg-[#EFE3D3] p-2.5 rounded-xl border border-[#8A7968]/20 cursor-pointer hover:bg-[#EADBC8] transition"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {it.image_url && (
                        <img src={it.image_url.split(',')[0]} alt="" className="w-6 h-6 object-cover rounded-md bg-white border border-[#8A7968]/30 shrink-0" />
                      )}
                      <span className="font-bold truncate">{it.name}</span>
                    </div>
                    <span className="font-black text-[#B76E79] shrink-0 ml-2">₹{it.price} × {it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-[#8A7968] pt-2 border-t border-[#8A7968]/20">
              <span className="font-bold">Submitted On:</span>
              <span>{new Date(result.created_at).toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="text-center pt-2 border-t border-[#8A7968]/20">
          <Link href="/school-po" className="text-xs text-[#B76E79] font-bold hover:underline">
            ← Back to School PO Catalog
          </Link>
        </div>
      </div>

      {/* Product Inspection Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-[#2B2B2B]/85 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-[#EFE3D3] border border-[#8A7968]/40 rounded-3xl shadow-2xl w-full max-w-md p-6 relative space-y-4 text-[#2B2B2B]">
            <div className="flex justify-between items-center border-b border-[#8A7968]/20 pb-2">
              <h3 className="font-bold text-sm">Product Specifications</h3>
              <button onClick={() => setViewingProduct(null)} className="text-xs bg-[#EADBC8] px-2.5 py-1 rounded-full font-bold cursor-pointer">
                ✕
              </button>
            </div>
            <div className="h-44 bg-[#F4EADE] rounded-2xl flex items-center justify-center p-2 border border-[#8A7968]/30">
              <img src={viewingProduct.image_url?.split(',')[0] || 'https://via.placeholder.com/200'} alt="" className="h-full w-full object-contain" />
            </div>
            <div>
              <h4 className="font-black text-base">{viewingProduct.name}</h4>
              <div className="text-sm font-extrabold text-[#B76E79] mt-1">₹{viewingProduct.price} per unit</div>
              {viewingProduct.description && (
                <p className="text-xs text-[#8A7968] mt-2 leading-relaxed">{viewingProduct.description}</p>
              )}
            </div>
            <div className="pt-2">
              <Link href={`/product/${viewingProduct.id}`} target="_blank" className="block text-center w-full bg-[#B76E79] text-white text-xs font-bold py-2.5 rounded-xl">
                Open Storefront Product Page ↗
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}