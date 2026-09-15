// app/school-po/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'
import { useCart } from '../context/CartContext'

export default function SchoolPOCatalog() {
  const [products, setProducts] = useState<any[]>([])
  const [discountPercent, setDiscountPercent] = useState<number>(15)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      // Fetch products
      const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (prodData) setProducts(prodData)

      // Fetch dynamic PO discount setting
      const { data: settingData } = await supabase.from('store_settings').select('setting_value').eq('id', 'school_po_discount_percent').single()
      if (settingData) {
        setDiscountPercent(Number(settingData.setting_value) || 15)
      }
      setLoading(false)
    }
    fetchData()
  }, [supabase])

  if (loading) {
    return <div className="min-h-screen bg-[#F4EADE] flex items-center justify-center font-bold text-[#8A7968]">Loading School PO Catalog...</div>
  }

  return (
    <div className="min-h-screen bg-[#F4EADE] text-[#2B2B2B] px-4 sm:px-8 py-6 sm:py-8 w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-[#EFE3D3] p-6 sm:p-8 rounded-3xl border border-[#8A7968]/30 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-[#B76E79] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
              🏛️ Institutional Sales & Atal Tinkering Lab Portal
            </span>
            <h1 className="text-xl sm:text-3xl font-black text-[#2B2B2B]">School PO Bulk Catalog ({discountPercent}% OFF)</h1>
            <p className="text-xs sm:text-sm text-[#8A7968] mt-1">
              Browse components and lab kits below with your exclusive institutional discount automatically applied to all items.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] font-bold text-xs px-4 py-2.5 rounded-xl border border-[#8A7968]/30 transition">
              ← Main Store
            </Link>
            <Link href="/cart" className="bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs">
              View Cart 🛒
            </Link>
          </div>
        </div>

        {/* Product Grid with Discounted Pricing */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full">
          {products.map((product) => {
            const firstImage = product.image_url ? product.image_url.split(',')[0].trim() : null
            const originalPrice = Number(product.price) || 0
            const schoolPrice = Math.round(originalPrice * (1 - discountPercent / 100))

            return (
              <div key={product.id} className="flex flex-col overflow-hidden rounded-2xl bg-[#EFE3D3] border border-[#8A7968]/30 shadow-2xs transition hover:shadow-md relative">
                <div className="absolute top-3 left-3 z-10 bg-[#B76E79] text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase shadow-2xs">
                  {discountPercent}% School OFF
                </div>

                <div className="h-44 sm:h-48 w-full bg-[#EADBC8]/50 flex items-center justify-center overflow-hidden border-b border-[#8A7968]/20">
                  {firstImage ? (
                    <img src={firstImage} alt={product.name} className="h-full w-full object-contain p-3" />
                  ) : (
                    <span className="text-[#8A7968] text-xs">Image Coming Soon</span>
                  )}
                </div>
                
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <span className="mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8A7968]">
                    {product.category || 'Uncategorized'}
                  </span>
                  <h3 className="mb-1.5 text-base sm:text-lg font-bold text-[#2B2B2B] leading-tight line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="mb-4 flex-1 text-xs sm:text-sm text-[#8A7968] line-clamp-2">
                    {product.description || 'No description available.'}
                  </p>
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8A7968] line-through">₹{originalPrice}</span>
                      <span className="text-lg sm:text-xl font-black text-[#B76E79]">₹{schoolPrice}</span>
                    </div>
                    <button 
                      onClick={() => addToCart({ ...product, price: schoolPrice }, 1)}
                      className="w-full rounded-xl bg-[#B76E79] hover:bg-[#9E5B65] py-2.5 text-xs sm:text-sm font-semibold text-white transition btn-press cursor-pointer"
                    >
                      Add PO Item 🏛️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}