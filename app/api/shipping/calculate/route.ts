// app/api/shipping/calculate/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { deliveryPincode, itemCount = 1 } = await req.json()

    if (!deliveryPincode || deliveryPincode.trim().length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Valid 6-digit delivery pincode is required.' },
        { status: 400 }
      )
    }

    const count = Number(itemCount) || 1

    // 1-5 products: ₹120, >5 products: ₹240
    const shippingFee = count <= 5 ? 120 : 240
    const processingFee = 0
    const totalCharge = shippingFee + processingFee

    // 3 to 5 business days calculation from today
    const today = new Date()
    const minDate = new Date(today)
    minDate.setDate(today.getDate() + 3)

    const maxDate = new Date(today)
    maxDate.setDate(today.getDate() + 5)

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    const estimatedDelivery = `${minDate.toLocaleDateString('en-US', options)} - ${maxDate.toLocaleDateString('en-US', options)} (3-5 Days)`

    return NextResponse.json({
      success: true,
      serviceable: true,
      shippingFee,
      processingFee,
      totalCharge,
      courierName: 'Shiprocket Surface Standard',
      estimatedDelivery,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}