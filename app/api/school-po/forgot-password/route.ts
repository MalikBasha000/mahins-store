// app/api/school-po/forgot-password/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, email, token, newPassword } = body

    if (action === 'REQUEST_RESET') {
      const cleanEmail = (email || '').trim().toLowerCase()
      if (!cleanEmail) {
        return NextResponse.json({ success: false, error: 'Please enter your registered school email.' }, { status: 400 })
      }

      const { data: school, error: findErr } = await supabaseAdmin
        .from('school_accounts')
        .select('id, school_name, educator_name, email')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (findErr || !school) {
        return NextResponse.json({ success: false, error: 'No registered institution found with this email address.' }, { status: 404 })
      }

      // Generate 32-byte secure token valid for 60 minutes
      const resetToken = crypto.randomBytes(32).toString('hex')
      const expiryDate = new Date(Date.now() + 60 * 60 * 1000).toISOString()

      const { error: updateErr } = await supabaseAdmin
        .from('school_accounts')
        .update({
          reset_token: resetToken,
          reset_token_expiry: expiryDate,
        })
        .eq('id', school.id)

      if (updateErr) throw updateErr

      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://mahinsonestoponestore.in')
        .replace(/[\[\]\(\)]/g, '')
        .replace(/\/+$/, '')
      const resetLink = `${siteUrl}/school-po/reset-password?token=${resetToken}`

      const emailUser = process.env.EMAIL_USER || 'mahinsonestoponestore@gmail.com'
      const emailPass = process.env.EMAIL_PASS

      if (!emailPass) {
        return NextResponse.json({
          success: false,
          error: 'EMAIL_PASS is not configured on the server. Please add it to your Vercel Environment Variables.'
        }, { status: 500 })
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      })

      await transporter.sendMail({
        from: `"Mahin's One-Stop One-Store" <${emailUser}>`,
        to: cleanEmail,
        subject: `🔐 Reset Password - School PO Portal (${school.school_name})`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #F4EADE; padding: 30px 15px; color: #2B2B2B;">
            <div style="max-width: 520px; margin: auto; background-color: #EFE3D3; border-radius: 20px; padding: 30px; border: 1px solid rgba(138, 121, 104, 0.3);">
              <h2 style="color: #2B2B2B; margin-top: 0; font-size: 20px;">Institutional Password Reset</h2>
              <p style="font-size: 14px; color: #4A3F35;">Dear <strong>${school.educator_name || 'Educator'}</strong>,</p>
              <p style="font-size: 13px; color: #666; line-height: 1.6;">
                A password reset request was initiated for your registered institution: <strong>${school.school_name}</strong>.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #B76E79; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 12px; font-weight: bold; font-size: 13px; display: inline-block;">
                  Click Here to Reset Password 🔑
                </a>
              </div>
              <p style="font-size: 11px; color: #8A7968; word-break: break-all;">
                Or copy and paste this link into your browser:<br/>
                <a href="${resetLink}" style="color: #B76E79;">${resetLink}</a>
              </p>
              <hr style="border: none; border-top: 1px solid rgba(138, 121, 104, 0.2); margin: 20px 0;" />
              <p style="font-size: 11px; color: #8A7968; margin-bottom: 0;">
                This link will automatically expire in 60 minutes. If you did not make this request, you can safely ignore this message.
              </p>
            </div>
          </div>
        `,
      })

      return NextResponse.json({
        success: true,
        message: `Password reset link has been dispatched to ${cleanEmail}. Please check your inbox or spam folder.`
      })
    }

    if (action === 'VERIFY_AND_UPDATE') {
      if (!token || !newPassword || newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'Valid token and a minimum 6-character password are required.' }, { status: 400 })
      }

      const { data: school, error: tokenErr } = await supabaseAdmin
        .from('school_accounts')
        .select('id, reset_token_expiry')
        .eq('reset_token', token)
        .maybeSingle()

      if (tokenErr || !school) {
        return NextResponse.json({ success: false, error: 'Invalid or expired password reset link. Please request a new one.' }, { status: 400 })
      }

      if (new Date(school.reset_token_expiry) < new Date()) {
        return NextResponse.json({ success: false, error: 'This password reset link has expired. Please request a new one.' }, { status: 400 })
      }

      const { error: saveErr } = await supabaseAdmin
        .from('school_accounts')
        .update({
          password_hash: newPassword,
          reset_token: null,
          reset_token_expiry: null,
        })
        .eq('id', school.id)

      if (saveErr) throw saveErr

      return NextResponse.json({ success: true, message: 'Password updated successfully! You can now log in.' })
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}