// app/api/school-po/send-email/route.ts
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      type, // 'NEW_PO_ALERT' | 'OFFICIAL_QUOTE' | 'STATUS_UPDATE'
      poId, 
      trackingId,
      schoolName, 
      educatorName, 
      customerEmail, 
      phone, 
      shippingAddress, 
      items, 
      totalAmount, 
      status, 
      customNotes 
    } = body

    const ADMIN_EMAIL = 'mahinsonestoponestore@gmail.com'
    const emailUser = process.env.EMAIL_USER || ADMIN_EMAIL
    const emailPass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || ''

    if (!emailPass) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing email password configuration (EMAIL_PASS is not set in environment variables).' 
      }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })

    // Format itemized table
    const itemsTableHtml = `
      <table style="width:100%; border-collapse: collapse; font-family: sans-serif; font-size: 13px; margin: 16px 0;">
        <thead>
          <tr style="background-color: #EFE3D3; color: #2B2B2B;">
            <th style="padding: 8px; border: 1px solid #8A7968; text-align: left;">Item</th>
            <th style="padding: 8px; border: 1px solid #8A7968; text-align: center;">Unit Price</th>
            <th style="padding: 8px; border: 1px solid #8A7968; text-align: center;">Qty</th>
            <th style="padding: 8px; border: 1px solid #8A7968; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(items || []).map((i: any) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #8A7968;">${i.name}</td>
              <td style="padding: 8px; border: 1px solid #8A7968; text-align: center;">₹${i.price}</td>
              <td style="padding: 8px; border: 1px solid #8A7968; text-align: center;">${i.quantity}</td>
              <td style="padding: 8px; border: 1px solid #8A7968; text-align: right;">₹${(Number(i.price) || 0) * (Number(i.quantity) || 1)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background-color: #F4EADE; font-weight: bold;">
            <td colspan="3" style="padding: 8px; border: 1px solid #8A7968; text-align: right;">Total Estimated Amount:</td>
            <td style="padding: 8px; border: 1px solid #8A7968; text-align: right; color: #B76E79;">₹${totalAmount}</td>
          </tr>
        </tfoot>
      </table>
    `

    if (type === 'NEW_PO_ALERT') {
      // 1. Email to Admin
      await transporter.sendMail({
        from: `"Mahin's Store Alerts" <${emailUser}>`,
        to: ADMIN_EMAIL,
        subject: `🚨 New School Purchase Order: ${schoolName} (Ref: ${trackingId})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; color: #2B2B2B;">
            <h2 style="color: #B76E79;">New School Purchase Order Received!</h2>
            <p><strong>Tracking / PO ID:</strong> ${trackingId}</p>
            <p><strong>School Name:</strong> ${schoolName}</p>
            <p><strong>Educator / Contact:</strong> ${educatorName} (${phone})</p>
            <p><strong>Official Email:</strong> ${customerEmail}</p>
            <p><strong>Delivery Address:</strong><br/>${shippingAddress}</p>
            <h3>Requested Items</h3>
            ${itemsTableHtml}
            <p><a href="https://mahinsonestoponestore.in/admin" style="display:inline-block; background-color:#B76E79; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none;">Open Admin Dashboard</a></p>
          </div>
        `
      })

      // 2. Acknowledgment to Customer
      await transporter.sendMail({
        from: `"Mahin's One-Stop One-Store" <${emailUser}>`,
        to: customerEmail,
        subject: `Official Purchase Order Request Received - ${trackingId}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; color: #2B2B2B;">
            <h2 style="color: #B76E79;">Institutional PO Received</h2>
            <p>Dear ${educatorName},</p>
            <p>Thank you for submitting a quotation & PO request for <strong>${schoolName}</strong>.</p>
            <p><strong>13-Digit Tracking ID:</strong> <span style="font-family: monospace; font-weight: bold; background: #eee; padding: 2px 6px;">${trackingId}</span></p>
            <p>Our team is reviewing your item requirements and preparing the formal GST quote and procurement invoice.</p>
            ${itemsTableHtml}
            <p>You can track your order status anytime at: <br/>
              <a href="https://mahinsonestoponestore.in/school-po/track">https://mahinsonestoponestore.in/school-po/track</a>
            </p>
            <br/>
            <p>Best Regards,<br/><strong>Mahin's One-Stop One-Store</strong></p>
          </div>
        `
      })
    } else if (type === 'OFFICIAL_QUOTE') {
      // Direct Admin Send Quote
      await transporter.sendMail({
        from: `"Mahin's One-Stop One-Store" <${emailUser}>`,
        to: customerEmail,
        subject: `Official Quotation Approved: ${schoolName} (PO: ${trackingId})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; color: #2B2B2B;">
            <h2 style="color: #B76E79;">Official Quotation & Proforma Confirmation</h2>
            <p>Dear ${educatorName},</p>
            <p>We are pleased to provide the official approved quotation for <strong>${schoolName}</strong>.</p>
            <p><strong>PO Reference / Tracking ID:</strong> <code>${trackingId}</code></p>
            ${itemsTableHtml}
            ${customNotes ? `<div style="background:#f9f9f9; padding:12px; border-left:4px solid #B76E79; margin:15px 0;"><strong>Admin Notes:</strong><br/>${customNotes}</div>` : ''}
            <p>Please review and confirm to schedule delivery and lab installation.</p>
            <br/>
            <p>Best Regards,<br/><strong>Institutional Sales Team</strong><br/>Mahin's One-Stop One-Store</p>
          </div>
        `
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('School PO email error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}