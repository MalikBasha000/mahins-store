// app/api/send-otp/route.ts
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json()

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'mahinsonestoponestore@gmail.com',
        pass: 'zjrmjdauhedxifsr', // Replace with your 16-character Google App Password
      },
    })

    await transporter.sendMail({
      from: '"Mahin\'s One-Store Admin" <mahinsonestoponestore@gmail.com>',
      to: email,
      subject: 'Your Secure Admin Login OTP',
      text: `Your secure admin verification code is: ${otp}. Do not share this code with anyone.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Mahin's One-Stop One-Store</h2>
          <p>You requested a secure login code for your Admin Dashboard.</p>
          <div style="background: #f3f4f6; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #666;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}