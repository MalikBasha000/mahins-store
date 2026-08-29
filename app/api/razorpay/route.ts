// app/api/razorpay/route.ts
import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
})

export async function POST(req: Request) {
  try {
    const { amount } = await req.json()

    const options = {
      amount: Math.round(amount * 100), // Amount in paise (e.g. ₹500 = 50000 paise)
      currency: 'INR',
      receipt: `receipt_${Date.now().toString().slice(-8)}`,
    }

    const order = await razorpay.orders.create(options)
    return NextResponse.json({ success: true, order })
  } catch (err: any) {
    console.error('Razorpay order creation error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}