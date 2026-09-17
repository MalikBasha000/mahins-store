// app/api/school-po/update-status/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'mahinsonestoponestore@gmail.com',
    pass: process.env.EMAIL_PASS,
  },
})

const STATUS_DETAILS: Record<string, { title: string; color: string; desc: string }> = {
  'Pending Review': {
    title: 'PO Under Review',
    color: '#8A7968',
    desc: 'Your purchase order inquiry has been received and is being verified by our lab team.'
  },
  'Quote Sent': {
    title: 'Official Quotation Sent',
    color: '#B76E79',
    desc: 'An official quotation has been prepared. Please review and accept or decline it in your School PO Portal.'
  },
  'PO Approved': {
    title: 'PO Approved & Verified',
    color: '#166534',
    desc: 'Your quotation/purchase order has been approved and queued for shipment assembly.'
  },
  'In Transit': {
    title: 'Order In Transit 🚚',
    color: '#1e40af',
    desc: 'Your school kit package is packed, dispatched, and currently in transit to your campus.'
  },
  'Delivered': {
    title: 'Order Successfully Delivered 📦',
    color: '#15803d',
    desc: 'Your shipment has reached the school campus. Please inspect the contents and ATL components.'
  },
  'Completed / Fulfilled': {
    title: 'Order Fulfilled',
    color: '#15803d',
    desc: 'All items have been fulfilled and delivery confirmed.'
  },
  'Rejected by School': {
    title: 'Quotation Declined by School',
    color: '#dc2626',
    desc: 'You have declined this quotation.'
  },
  'Cancelled': {
    title: 'PO Cancelled',
    color: '#991b1b',
    desc: 'This purchase order request was cancelled.'
  }
}

export async function POST(req: Request) {
  try {
    const { poId, status, rejectionReason } = await req.json()

    if (!poId || !status) {
      return NextResponse.json({ success: false, error: 'Missing PO ID or status.' }, { status: 400 })
    }

    const updates: any = { status }
    if (rejectionReason !== undefined) {
      updates.rejection_reason = rejectionReason
      updates.quote_response_at = new Date().toISOString()
    }

    // Targets purchase_orders table
    const { data: po, error: updateErr } = await supabaseAdmin
      .from('purchase_orders')
      .update(updates)
      .eq('id', poId)
      .select('*, school_accounts(school_name, educator_name, email)')
      .single()

    if (updateErr || !po) {
      throw updateErr || new Error('Purchase order not found.')
    }

    const recipientEmail = po.school_accounts?.email || po.email
    const schoolName = po.school_accounts?.school_name || po.school_name || 'Institution'
    const educatorName = po.school_accounts?.educator_name || po.educator_name || 'Lab Incharge'
    const statusMeta = STATUS_DETAILS[status] || {
      title: status,
      color: '#B76E79',
      desc: `Your PO status has been updated to: ${status}`
    }

    // Dispatch automated email notification
    if (recipientEmail && process.env.EMAIL_PASS) {
      try {
        const emailUser = process.env.EMAIL_USER || 'mahinsonestoponestore@gmail.com'

        await transporter.sendMail({
          from: `"Mahin's School PO Portal" <${emailUser}>`,
          to: recipientEmail,
          subject: `📦 PO Update [${po.tracking_id}]: ${statusMeta.title}`,
          html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; background-color: #F4EADE; padding: 25px; margin: 0; color: #2B2B2B;">
              <div style="max-width: 540px; margin: 0 auto; background-color: #EFE3D3; border-radius: 20px; padding: 30px; border: 1px solid rgba(138, 121, 104, 0.3);">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(138, 121, 104, 0.2); padding-bottom: 15px;">
                  <h3 style="margin: 0; color: #2B2B2B; font-size: 18px;">Mahin's School PO Portal</h3>
                  <span style="font-weight: bold; font-size: 11px; background-color: ${statusMeta.color}; color: #ffffff; padding: 5px 12px; border-radius: 9999px;">
                    ${status}
                  </span>
                </div>
                
                <p style="margin-top: 20px; font-size: 14px; color: #2B2B2B;">
                  Dear <strong>${educatorName}</strong> (${schoolName}),
                </p>
                
                <p style="font-size: 13px; color: #4A3F35; line-height: 1.6;">
                  ${statusMeta.desc}
                </p>

                <div style="background-color: #F4EADE; border-radius: 12px; padding: 15px; margin: 20px 0; border: 1px solid rgba(138, 121, 104, 0.25);">
                  <div style="font-size: 12px; margin-bottom: 6px;"><strong>Tracking ID:</strong> ${po.tracking_id}</div>
                  <div style="font-size: 12px; margin-bottom: 6px;"><strong>Estimated Amount:</strong> ₹${po.total_estimate || po.total || 0}</div>
                  ${rejectionReason ? `<div style="font-size: 12px; color: #dc2626; margin-top: 6px;"><strong>Feedback / Reason:</strong> ${rejectionReason}</div>` : ''}
                </div>

                <div style="text-align: center; margin: 25px 0 10px;">
                  <a href="https://mahinsonestoponestore.in/school-po/orders" target="_blank" rel="noopener noreferrer" style="background-color: #B76E79; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 13px; display: inline-block;">
                    Open School PO Portal
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid rgba(138, 121, 104, 0.2); margin: 20px 0;" />
                <p style="font-size: 11px; color: #8A7968; margin-bottom: 0;">
                  Institutional Sales & ATL Lab Portal • Mahin's One-Stop One-Store
                </p>
              </div>
            </body>
            </html>
          `
        })
      } catch (mailErr) {
        console.warn('Could not dispatch status email:', mailErr)
      }
    }

    return NextResponse.json({ success: true, message: `Status updated to ${status}` })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}