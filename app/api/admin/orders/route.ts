// app/api/admin/orders/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// GET all orders
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, orders: orders || [] })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// PATCH: Update order status & send emails
export async function PATCH(req: Request) {
  try {
    const { orderId, newStatus, customReason } = await req.json()
    const supabaseAdmin = getSupabaseAdmin()
    const ADMIN_EMAIL = 'mahinsonestoponestore@gmail.com'
    const FROM_SENDER = "Mahin's One-Stop One-Store <orders@mahinsonestoponestore.in>"
    const baseUrl = 'https://www.mahinsonestoponestore.in'

    // 1. Fetch the exact order row
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const oldStatus = order.status

    // 2. Update status in DB
    const updatePayload: any = { status: newStatus }
    if (newStatus === 'Cancelled') {
      updatePayload.cancellation_reason = customReason
    }

    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
    }

    // 3. Stock replenishment / deduction
    if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled' && Array.isArray(order.items)) {
      for (const item of order.items) {
        const prodId = item.id || item.product_id
        const qty = item.quantity || 1
        const { data: prod } = await supabaseAdmin.from('products').select('stock').eq('id', prodId).single()
        if (prod) {
          await supabaseAdmin.from('products').update({ stock: prod.stock + qty }).eq('id', prodId)
        }
      }
    }

    if (oldStatus === 'Cancelled' && newStatus !== 'Cancelled' && Array.isArray(order.items)) {
      for (const item of order.items) {
        const prodId = item.id || item.product_id
        const qty = item.quantity || 1
        const { data: prod } = await supabaseAdmin.from('products').select('stock').eq('id', prodId).single()
        if (prod) {
          await supabaseAdmin.from('products').update({ stock: Math.max(0, prod.stock - qty) }).eq('id', prodId)
        }
      }
    }

    // 4. Find Customer Email from ALL possible keys in the database row
    let customerEmail = ''

    // Scan all columns for an email string
    for (const key of Object.keys(order)) {
      const val = order[key]
      if (typeof val === 'string' && val.includes('@') && val.includes('.')) {
        // Exclude admin email if accidentally stored
        if (val.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
          customerEmail = val.trim()
          break
        }
      }
    }

    // Fallback: Check auth.users if user_id exists
    if (!customerEmail && order.user_id) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(order.user_id)
        if (userData?.user?.email) {
          customerEmail = userData.user.email.trim()
        }
      } catch (e) {
        console.error('Error fetching auth user:', e)
      }
    }

    // Fallback: Extract from shipping_address string if user typed email inside address
    if (!customerEmail && typeof order.shipping_address === 'string') {
      const match = order.shipping_address.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
      if (match && match[0].toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        customerEmail = match[0].trim()
      }
    }

    // 5. Status Update Email Template
    const statusHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #312e81; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Mahin's One-Stop One-Store</h2>
          <p style="color: #c7d2fe; margin: 4px 0 0 0; font-size: 13px;">Shipment Status Update</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 14px; color: #374151; margin: 0 0 16px 0;">
            Your order status has been updated for Tracking ID: 
            <strong style="font-family: monospace; color: #1e1b4b;">${order.tracking_id}</strong>
          </p>
          
          <div style="background: #eef2ff; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 14px 18px; margin: 16px 0;">
            <span style="font-size: 12px; color: #4b5563; text-transform: uppercase; font-weight: bold; display: block;">Current Status</span>
            <span style="font-size: 18px; font-weight: 800; color: #4338ca;">${newStatus}</span>
            ${
              customReason || order.cancellation_reason
                ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #b91c1c;"><strong>Details:</strong> ${customReason || order.cancellation_reason}</p>`
                : ''
            }
          </div>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin: 20px 0 16px 0; text-align: center;">
            <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 500;">
              Log in on the store website to check your full order history and live details.
            </p>
          </div>

          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0 10px 0;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" bgcolor="#4f46e5" style="border-radius: 8px;">
                      <a href="${baseUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 13px; font-family: sans-serif; font-weight: bold; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; border: 1px solid #4f46e5; display: inline-block;">
                        Go to Website 🌐
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `

    let customerEmailStatus = 'Not sent (no email found in order record)'

    // 6. Send to Customer
    if (customerEmail) {
      try {
        const sendResult = await resend.emails.send({
          from: FROM_SENDER,
          to: [customerEmail],
          subject: `Status Update: ${newStatus} - #${order.tracking_id} | Mahin's Store`,
          html: statusHtml,
        })
        customerEmailStatus = `Sent to ${customerEmail}`
      } catch (err: any) {
        customerEmailStatus = `Failed sending to ${customerEmail}: ${err.message}`
        console.error('Resend Error:', err)
      }
    }

    // 7. Send to Admin
    try {
      await resend.emails.send({
        from: FROM_SENDER,
        to: [ADMIN_EMAIL],
        subject: `[STATUS UPDATED] #${order.tracking_id} → ${newStatus} (${customerEmail || 'No Customer Email'})`,
        html: statusHtml,
      })
    } catch (err) {
      console.error('Admin Resend Error:', err)
    }

    return NextResponse.json({
      success: true,
      message: `Status updated to ${newStatus}`,
      customerEmail: customerEmail || 'None',
      customerEmailStatus,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}