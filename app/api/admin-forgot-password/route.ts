// app/api/admin-forgot-password/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    const ADMIN_EMAIL = 'mahinsonestoponestore@gmail.com'
    const FROM_SENDER = "Mahin's One-Stop One-Store <orders@mahinsonestoponestore.in>"

    if (!email || email.trim().toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: 'Email not registered as store administrator.' },
        { status: 400 }
      )
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString()

    const resetHtml = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #1e1b4b; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 18px;">Admin Password Reset Request</h2>
        </div>
        <div style="padding: 24px; text-align: center;">
          <p style="color: #4b5563; font-size: 14px; margin-bottom: 20px;">Use this secure 6-digit recovery OTP to access your admin console:</p>
          <div style="background: #f1f5f9; padding: 14px; border-radius: 8px; font-family: monospace; font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #1e1b4b; display: inline-block;">
            ${resetOtp}
          </div>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">If you did not request this, please disregard this email.</p>
        </div>
      </div>
    `

    await resend.emails.send({
      from: FROM_SENDER,
      to: [ADMIN_EMAIL],
      subject: `Admin Security Code - #${resetOtp} | Mahin's One-Stop One-Store`,
      html: resetHtml,
    })

    return NextResponse.json({ success: true, otp: resetOtp })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}