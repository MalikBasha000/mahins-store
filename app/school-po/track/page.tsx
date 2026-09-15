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
  const supabase = createClient()

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = poReference.trim().toLowerCase()
    if (!query) return

    setLoading(true)
    setSearched(true)
    setResult(null)

    // Check if query is a UUID or an email address
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query)

    let req = supabase.from('purchase_orders').select('*')

    if (isUuid) {
      req = req.eq('id', query)
    } else {
      req = req.eq('email', query)
    }

    const { data } = await req.order('created_at', { ascending: false }).limit(1)

    if (data && data.length > 0) {
      setResult(data[0])
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F4EADE] text-[#2B2B2B] px-4 sm:px-8 py-8 sm:py-12 flex flex-col items-center">
      <div className="w-full max-w-xl bg-[#EFE3D3] p-6 sm:p-8 rounded-3xl border border-[#8A7968]/30 shadow-xs space-y-6">
        <div className="text-center space-y-1">
          <div className="text-3xl">🚚</div>
          <h1 className="text-xl sm:text-2xl font-black">Track Institutional PO / Quote</h1>
          <p className="text-xs text-[#8A7968]">
            Enter your purchase order reference ID (UUID) or registered school email address.
          </p>
        </div>

        <form onSubmit={handleTrack} className="flex gap-2">
          <input
            type="text"
            required
            value={poReference}
            onChange={(e) => setPoReference(e.target.value)}
            placeholder="Enter PO ID or School Email..."
            className="flex-1 border border-[#8A7968]/40 bg-[#F4EADE] p-3 rounded-xl text-xs text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden"
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
            No matching purchase order found. Please check your reference ID or school email.
          </div>
        )}

        {result && (
          <div className="bg-[#F4EADE] p-5 rounded-2xl border border-[#8A7968]/30 space-y-3.5 text-xs">
            <div className="flex justify-between items-center border-b border-[#8A7968]/20 pb-2">
              <span className="font-bold text-[#8A7968]">Institution:</span>
              <span className="font-black text-sm text-[#2B2B2B]">{result.school_name}</span>
            </div>

            <div className="flex justify-between items-center border-b border-[#8A7968]/20 pb-2">
              <span className="font-bold text-[#8A7968]">Educator Incharge:</span>
              <span className="font-bold text-[#2B2B2B]">{result.educator_name}</span>
            </div>

            <div className="flex justify-between items-center border-b border-[#8A7968]/20 pb-2">
              <span className="font-bold text-[#8A7968]">Status:</span>
              <span className="bg-green-100 text-green-800 border border-green-200 font-black px-2.5 py-0.5 rounded-full uppercase text-[10px]">
                {result.status || 'Pending Review'}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-[#8A7968]/20 pb-2">
              <span className="font-bold text-[#8A7968]">Estimated Amount:</span>
              <span className="font-black text-base text-[#B76E79]">₹{result.total_estimated_amount}</span>
            </div>

            <div className="border-b border-[#8A7968]/20 pb-2 space-y-1">
              <span className="font-bold text-[#8A7968]">Items in PO:</span>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                {Array.isArray(result.items) && result.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between bg-[#EFE3D3] p-1.5 rounded-lg text-[11px]">
                    <span className="truncate">{it.name}</span>
                    <span className="font-bold">x{it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-[#8A7968]">
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
    </div>
  )
}