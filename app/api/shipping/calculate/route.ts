// app/api/shipping/calculate/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
}

export async function POST(req: Request) {
  try {
    const { deliveryPincode, items = [], subtotal = 0 } = await req.json()

    if (!deliveryPincode || deliveryPincode.trim().length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Valid 6-digit delivery pincode is required.' },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: true,
        shippingFee: 0,
        processingFee: 0,
        totalCharge: 0,
        estimatedDelivery: '3 - 5 Business Days',
      })
    }

    // Dynamic 3 to 5 business days estimation
    const today = new Date()
    const minDate = new Date(today)
    minDate.setDate(today.getDate() + 3)
    const maxDate = new Date(today)
    maxDate.setDate(today.getDate() + 5)

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    const estimatedDelivery = `${minDate.toLocaleDateString('en-US', options)} - ${maxDate.toLocaleDateString('en-US', options)} (3-5 Days)`

    // Free shipping threshold rule: Orders above ₹1000 get ₹0 shipping
    if (Number(subtotal) > 1000) {
      return NextResponse.json({
        success: true,
        shippingFee: 0,
        processingFee: 0,
        totalCharge: 0,
        courierName: 'Shiprocket Surface Standard',
        estimatedDelivery,
        isFreeShipping: true,
      })
    }

    const supabase = getSupabaseAdmin()
    const productIds = items.map((i: any) => i.id || i.product_id).filter(Boolean)

    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, base_shipping_fee, extra_shipping_fee')
      .in('id', productIds)

    const productRateMap = new Map<string, { base: number; extra: number }>()
    if (dbProducts) {
      dbProducts.forEach((p: any) => {
        productRateMap.set(p.id, {
          base: Number(p.base_shipping_fee ?? 120),
          extra: Number(p.extra_shipping_fee ?? 80),
        })
      })
    }

    let calculatedShippingFee = 0

    for (const item of items) {
      const pId = item.id || item.product_id
      const qty = Math.max(1, Number(item.quantity) || 1)
      const rates = productRateMap.get(pId) || { base: 120, extra: 80 }

      const itemShipping = rates.base + (qty - 1) * rates.extra
      calculatedShippingFee += itemShipping
    }

    return NextResponse.json({
      success: true,
      shippingFee: calculatedShippingFee,
      processingFee: 0,
      totalCharge: calculatedShippingFee,
      courierName: 'Shiprocket Surface Standard',
      estimatedDelivery,
      isFreeShipping: false,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}