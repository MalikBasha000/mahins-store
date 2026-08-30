// app/api/verify-payment/route.ts
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Missing required payment parameters' }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || ''
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex')

    if (generated_signature === razorpay_signature) {
      return NextResponse.json({ success: true, message: 'Payment verified successfully' })
    } else {
      return NextResponse.json({ success: false, error: 'Signature mismatch' }, { status: 400 })
    }
  } catch (err: any) {
    console.error('Signature verification error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}