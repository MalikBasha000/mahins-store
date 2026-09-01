// app/api/customer-otp/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json()
    const FROM_SENDER = "Mahin's One-Stop One-Store <orders@mahinsonestoponestore.in>"

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and OTP are required' }, { status: 400 })
    }

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #312e81; padding: 24px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">Mahin's One-Stop One-Store</h2>
          <p style="color: #c7d2fe; margin: 4px 0 0 0; font-size: 13px;">Customer Account Verification</p>
        </div>
        <div style="padding: 24px; text-align: center;">
          <h3 style="font-size: 16px; color: #111827; margin-bottom: 10px;">Welcome! Verify Your Email</h3>
          <p style="font-size: 14px; color: #374151; margin-bottom: 20px;">Please use the verification code below to complete your registration:</p>
          <div style="background: #eef2ff; color: #4338ca; font-size: 28px; font-weight: 900; letter-spacing: 6px; padding: 14px 20px; border-radius: 8px; display: inline-block; margin-bottom: 20px;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #6b7280; margin: 0;">If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `

    await resend.emails.send({
      from: FROM_SENDER,
      to: [email.trim()],
      subject: `Your Registration OTP: ${otp} | Mahin's Store`,
      html: htmlContent,
    })

    return NextResponse.json({ success: true, message: 'OTP sent successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to send OTP' }, { status: 500 })
  }
}