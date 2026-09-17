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
  'Quote Accepted by School': {
    title: 'Quotation Accepted by School',
    color: '#15803d',
    desc: 'You have accepted the official quotation. The store admin has been notified to process fulfillment.'
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

    const { data: po, error: updateErr } = await supabaseAdmin
      .from('purchase_orders')
      .update(updates)
      .eq('id', poId)
      .select('*')
      .single()

    if (updateErr || !po) {
      throw updateErr || new Error('Purchase order not found.')
    }

    const recipientEmail = (po.email || '').trim().toLowerCase()
    const schoolName = po.school_name || 'Institution'
    const educatorName = po.educator_name || 'Lab Incharge'
    const trackingCode = po.tracking_id || 'PO Ref'
    const totalAmount = po.total_estimated_amount || po.total_estimate || po.total || 0

    const emailUser = process.env.EMAIL_USER || 'mahinsonestoponestore@gmail.com'

    // 1. Notify Customer if email credentials exist
    if (recipientEmail && process.env.EMAIL_PASS) {
      const statusMeta = STATUS_DETAILS[status] || {
        title: status,
        color: '#B76E79',
        desc: `Your PO status has been updated to: ${status}`
      }

      try {
        await transporter.sendMail({
          from: `"Mahin's School PO Portal" <${emailUser}>`,
          to: recipientEmail,
          subject: `📦 PO Update [${trackingCode}] - ${statusMeta.title}`,
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin: 0; padding: 0; background-color: #F4EADE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4EADE; padding: 25px 12px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #EFE3D3; border-radius: 24px; border: 1px solid rgba(138, 121, 104, 0.35); overflow: hidden;">
                      <tr>
                        <td style="padding: 24px; border-bottom: 1px solid rgba(138, 121, 104, 0.25);">
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td valign="middle" align="left">
                                <span style="font-size: 16px; font-weight: 900; color: #2B2B2B; display: block;">Mahin's School PO Portal</span>
                                <span style="font-size: 11px; font-weight: 700; color: #8A7968; display: block; margin-top: 2px;">Institutional Sales &amp; ATL Lab</span>
                              </td>
                              <td valign="middle" align="right">
                                <span style="display: inline-block; background-color: ${statusMeta.color}; color: #ffffff !important; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 30px; text-transform: uppercase;">
                                  ${status}
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 24px;">
                          <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #2B2B2B;">Dear ${educatorName} (${schoolName}),</p>
                          <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #4A3F35;">${statusMeta.desc}</p>
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4EADE; border-radius: 16px; border: 1px solid rgba(138, 121, 104, 0.25); margin-bottom: 24px;">
                            <tr>
                              <td style="padding: 16px;">
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td style="font-size: 11px; font-weight: 800; color: #8A7968; text-transform: uppercase;">PO Tracking ID</td>
                                    <td align="right" style="font-size: 11px; font-weight: 800; color: #8A7968; text-transform: uppercase;">Total Estimate</td>
                                  </tr>
                                  <tr>
                                    <td style="font-size: 14px; font-family: monospace; font-weight: 900; color: #2B2B2B;">${trackingCode}</td>
                                    <td align="right" style="font-size: 16px; font-weight: 900; color: #B76E79;">₹${totalAmount}</td>
                                  </tr>
                                  ${rejectionReason ? `
                                  <tr>
                                    <td colspan="2" style="padding-top: 10px; border-top: 1px solid rgba(138, 121, 104, 0.2); margin-top: 8px;">
                                      <span style="font-size: 11px; font-weight: 700; color: #dc2626; display: block;">Declined Reason: ${rejectionReason}</span>
                                    </td>
                                  </tr>
                                  ` : ''}
                                </table>
                              </td>
                            </tr>
                          </table>
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="center">
                                <a href="https://mahinsonestoponestore.in/school-po/orders" target="_blank" rel="noopener noreferrer" style="background-color: #B76E79; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-weight: 800; font-size: 13px; display: inline-block;">
                                  Open School PO Portal 📋
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 16px; border-top: 1px solid rgba(138, 121, 104, 0.2); background-color: #EADBC8;">
                          <p style="margin: 0; font-size: 11px; font-weight: 700; color: #8A7968;">Mahin's One-Stop One-Store • Institutional Sales</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `
        })
      } catch (mailErr) {
        console.warn('Could not dispatch customer status email:', mailErr)
      }
    }

    // 2. Alert Admin when school accepts or rejects quotation
    if (status === 'Quote Accepted by School' && process.env.EMAIL_PASS) {
      try {
        const adminEmail = 'mahinsonestoponestore@gmail.com'
        await transporter.sendMail({
          from: `"School PO Notifications" <${emailUser}>`,
          to: adminEmail,
          subject: `🎉 School Accepted Quotation! [${trackingCode}] - ${schoolName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 25px 12px; background-color: #F4EADE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #EFE3D3; border-radius: 24px; border: 1px solid rgba(138, 121, 104, 0.35); overflow: hidden;">
                      <tr>
                        <td style="padding: 24px; background-color: #15803d; color: #ffffff;">
                          <h2 style="margin: 0; font-size: 18px;">🎉 School Approved Quotation</h2>
                          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Ready for fulfillment and packing</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 24px; color: #2B2B2B;">
                          <p style="font-size: 14px; margin-top: 0;"><strong>${schoolName}</strong> has officially accepted your quotation.</p>
                          <div style="background-color: #F4EADE; border-radius: 14px; padding: 16px; margin-bottom: 20px; border: 1px solid rgba(138, 121, 104, 0.25);">
                            <div style="font-size: 12px; margin-bottom: 6px;"><strong>PO Tracking ID:</strong> ${trackingCode}</div>
                            <div style="font-size: 12px; margin-bottom: 6px;"><strong>Educator Contact:</strong> ${educatorName} (${po.phone || 'N/A'})</div>
                            <div style="font-size: 12px; margin-bottom: 6px;"><strong>School Email:</strong> ${recipientEmail}</div>
                            <div style="font-size: 13px; font-weight: bold; color: #B76E79; margin-top: 8px;">Order Value: ₹${totalAmount}</div>
                          </div>
                          <div style="text-align: center;">
                            <a href="https://mahinsonestoponestore.in/admin" target="_blank" rel="noopener noreferrer" style="background-color: #B76E79; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 12px; font-weight: bold; font-size: 13px; display: inline-block;">
                              Open Admin Dashboard 🚀
                            </a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `
        })
      } catch (adminMailErr) {
        console.warn('Could not dispatch admin alert email:', adminMailErr)
      }
    }

    return NextResponse.json({ success: true, message: `Status updated to ${status}` })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}