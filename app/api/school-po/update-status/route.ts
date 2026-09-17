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
    const statusMeta = STATUS_DETAILS[status] || {
      title: status,
      color: '#B76E79',
      desc: `Your PO status has been updated to: ${status}`
    }

    if (recipientEmail && process.env.EMAIL_PASS) {
      try {
        const emailUser = process.env.EMAIL_USER || 'mahinsonestoponestore@gmail.com'

        await transporter.sendMail({
          from: `"Mahin's School PO Portal" <${emailUser}>`,
          to: recipientEmail,
          subject: `📦 PO Update [${po.tracking_id || 'PO Ref'}] - ${statusMeta.title}`,
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Purchase Order Update</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #F4EADE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
              
              <!-- Outer Wrapper Table -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4EADE; width: 100% !important; margin: 0; padding: 25px 12px;">
                <tr>
                  <td align="center">
                    
                    <!-- Main Card Table (max 540px) -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #EFE3D3; border-radius: 24px; border: 1px solid rgba(138, 121, 104, 0.35); overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                      
                      <!-- Header Section -->
                      <tr>
                        <td style="padding: 24px 24px 18px 24px; border-bottom: 1px solid rgba(138, 121, 104, 0.25);">
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td valign="middle" align="left">
                                <span style="font-size: 16px; font-weight: 900; color: #2B2B2B; display: block; letter-spacing: -0.3px;">
                                  Mahin's School PO Portal
                                </span>
                                <span style="font-size: 11px; font-weight: 700; color: #8A7968; display: block; margin-top: 2px;">
                                  Institutional Sales &amp; ATL Lab
                                </span>
                              </td>
                              <td valign="middle" align="right">
                                <span style="display: inline-block; background-color: ${statusMeta.color}; color: #ffffff !important; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 30px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                                  ${status}
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Body Content -->
                      <tr>
                        <td style="padding: 24px;">
                          
                          <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #2B2B2B;">
                            Dear ${educatorName} <span style="font-weight: normal; color: #665c52;">(${schoolName})</span>,
                          </p>
                          
                          <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #4A3F35;">
                            ${statusMeta.desc}
                          </p>

                          <!-- Order Summary Box -->
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4EADE; border-radius: 16px; border: 1px solid rgba(138, 121, 104, 0.25); margin-bottom: 24px;">
                            <tr>
                              <td style="padding: 16px;">
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td style="font-size: 11px; font-weight: 800; color: #8A7968; text-transform: uppercase; padding-bottom: 4px;">
                                      PO Tracking ID
                                    </td>
                                    <td align="right" style="font-size: 11px; font-weight: 800; color: #8A7968; text-transform: uppercase; padding-bottom: 4px;">
                                      Total Estimate
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="font-size: 14px; font-family: monospace, monospace; font-weight: 900; color: #2B2B2B;">
                                      ${po.tracking_id || 'N/A'}
                                    </td>
                                    <td align="right" style="font-size: 16px; font-weight: 900; color: #B76E79;">
                                      ₹${po.total_estimated_amount || po.total_estimate || po.total || 0}
                                    </td>
                                  </tr>
                                  ${rejectionReason ? `
                                  <tr>
                                    <td colspan="2" style="padding-top: 10px; border-top: 1px solid rgba(138, 121, 104, 0.2); margin-top: 8px;">
                                      <span style="font-size: 11px; font-weight: 700; color: #dc2626; display: block;">
                                        Declined Reason: ${rejectionReason}
                                      </span>
                                    </td>
                                  </tr>
                                  ` : ''}
                                </table>
                              </td>
                            </tr>
                          </table>

                          <!-- Call to Action Button -->
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="center">
                                <a href="https://mahinsonestoponestore.in/school-po/orders" target="_blank" rel="noopener noreferrer" style="background-color: #B76E79; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-weight: 800; font-size: 13px; display: inline-block; box-shadow: 0 2px 6px rgba(183, 110, 121, 0.35);">
                                  Open School PO Portal 📋
                                </a>
                              </td>
                            </tr>
                          </table>

                        </td>
                      </tr>

                      <!-- Footer Section -->
                      <tr>
                        <td align="center" style="padding: 16px 24px 20px 24px; border-top: 1px solid rgba(138, 121, 104, 0.2); background-color: #EADBC8;">
                          <p style="margin: 0; font-size: 11px; font-weight: 700; color: #8A7968;">
                            Mahin's One-Stop One-Store • Institutional Division
                          </p>
                          <p style="margin: 4px 0 0 0; font-size: 10px; color: #8A7968;">
                            Official ATL Lab &amp; STEM Equipment Supplier
                          </p>
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
        console.warn('Could not dispatch status email:', mailErr)
      }
    }

    return NextResponse.json({ success: true, message: `Status updated to ${status}` })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}