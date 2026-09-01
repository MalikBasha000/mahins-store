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

// Deep extractor for customer email
async function extractOrderEmail(order: any, supabaseAdmin: any): Promise<string> {
  const ADMIN_EMAIL = 'mahinsonestoponestore@gmail.com'

  // 1. Check shipping_address_snapshot
  if (order.shipping_address_snapshot) {
    try {
      const snap = typeof order.shipping_address_snapshot === 'string'
        ? JSON.parse(order.shipping_address_snapshot)
        : order.shipping_address_snapshot

      if (snap) {
        const candidate = snap.email || snap.customer_email || snap.user_email
        if (typeof candidate === 'string' && candidate.includes('@') && candidate.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
          return candidate.trim()
        }
      }
    } catch {
      // Ignore JSON parse error
    }
  }

  // 2. Direct columns if present
  const directCols = [order.customer_email, order.email, order.user_email, order.customerEmail]
  for (const c of directCols) {
    if (typeof c === 'string' && c.includes('@') && c.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return c.trim()
    }
  }

  // 3. Check customer_addresses table by user_id
  if (order.user_id) {
    try {
      const { data: addr } = await supabaseAdmin
        .from('customer_addresses')
        .select('*')
        .eq('user_id', order.user_id)
        .maybeSingle()

      if (addr?.email && addr.email.includes('@')) {
        return addr.email.trim()
      }
    } catch {}

    // 4. Check auth.users table via Admin API
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(order.user_id)
      if (authUser?.user?.email && authUser.user.email.includes('@')) {
        return authUser.user.email.trim()
      }
    } catch {}
  }

  // 5. Check regex match in shipping_address string
  if (typeof order.shipping_address === 'string') {
    const match = order.shipping_address.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    if (match && match[0].toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return match[0].trim()
    }
  }

  return ''
}

// GET: Return all orders with live product name/image syncing
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

    // Fetch all products once to map live inventory details efficiently
    const { data: allProducts } = await supabaseAdmin.from('products').select('*')
    const productMap: Record<string, any> = {}
    if (allProducts) {
      for (const p of allProducts) {
        productMap[p.id] = p
      }
    }

    const resolvedOrders = await Promise.all(
      (orders || []).map(async (order) => {
        const resolvedEmail = await extractOrderEmail(order, supabaseAdmin)
        
        // Dynamically update item names & images from live inventory if available
        let updatedItems = order.items
        if (Array.isArray(order.items)) {
          updatedItems = order.items.map((item: any) => {
            const pId = item.id || item.product_id
            const liveProd = pId ? productMap[pId] : null
            if (liveProd) {
              return {
                ...item,
                name: liveProd.name || liveProd.title || item.name,
                price: liveProd.price ?? item.price,
                image_url: liveProd.image_url || item.image_url,
              }
            }
            return item
          })
        }

        return {
          ...order,
          customer_email: resolvedEmail || '',
          items: updatedItems,
        }
      })
    )

    return NextResponse.json({ success: true, orders: resolvedOrders })
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
    const adminLoginUrl = 'https://www.mahinsonestoponestore.in/admin'

    // 1. Fetch current order
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const oldStatus = order.status

    // 2. Resolve Customer Email
    const customerEmail = await extractOrderEmail(order, supabaseAdmin)

    // 3. Update status in Database
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

    // 4. Handle stock replenishments
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

    // 5. CUSTOMER EMAIL (Direct link to /track?id=)
    const customerStatusHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #312e81; padding: 24px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">Mahin's One-Stop One-Store</h2>
          <p style="color: #c7d2fe; margin: 4px 0 0 0; font-size: 13px;">Shipment Status Update</p>
        </div>

        <div style="padding: 24px;">
          <h3 style="font-size: 15px; color: #111827; margin: 0 0 10px 0;">Hello ${order.customer_name || 'Valued Customer'},</h3>
          <p style="font-size: 14px; color: #374151; margin: 0 0 16px 0; line-height: 1.5;">
            Your order status has been updated for Tracking ID: 
            <strong style="font-family: monospace; color: #1e1b4b; letter-spacing: 1px;">${order.tracking_id}</strong>
          </p>
          
          <div style="background: #eef2ff; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 14px 18px; margin: 16px 0;">
            <span style="font-size: 11px; color: #4b5563; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 2px;">Current Status</span>
            <span style="font-size: 18px; font-weight: 800; color: #4338ca;">${newStatus}</span>
            ${
              customReason || order.cancellation_reason
                ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #b91c1c;"><strong>Details:</strong> ${customReason || order.cancellation_reason}</p>`
                : ''
            }
          </div>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin: 20px 0 16px 0; text-align: center;">
            <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 500;">
              You can track your order status and details directly on our website anytime.
            </p>
          </div>

          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0 10px 0;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" bgcolor="#4f46e5" style="border-radius: 8px;">
                      <a href="${baseUrl}/track?id=${order.tracking_id}" target="_blank" rel="noopener noreferrer" style="font-size: 13px; font-family: sans-serif; font-weight: bold; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; border: 1px solid #4f46e5; display: inline-block;">
                        Track Order Live 📦
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

    // 6. ADMIN EMAIL (Direct Admin Portal Button)
    const adminStatusHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 2px solid #312e81; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #1e1b4b; padding: 20px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 18px;">🛡️ [ADMIN AUDIT] Order Status Updated</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #a5b4fc;">A status change was recorded in your store.</p>
        </div>

        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 8px; font-size: 13px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 12px; color: #6b7280;"><strong>Tracking ID:</strong></td>
              <td style="padding: 8px 12px; font-family: monospace; font-weight: bold; color: #312e81;">${order.tracking_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; color: #6b7280;"><strong>Customer Name:</strong></td>
              <td style="padding: 8px 12px; color: #111827; font-weight: bold;">${order.customer_name || 'Guest'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; color: #6b7280;"><strong>Customer Email:</strong></td>
              <td style="padding: 8px 12px; color: #111827; font-weight: bold;">${customerEmail || 'Not Available'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; color: #6b7280;"><strong>New Status:</strong></td>
              <td style="padding: 8px 12px; font-weight: 800; color: #4338ca; font-size: 15px;">${newStatus}</td>
            </tr>
            ${
              customReason || order.cancellation_reason
                ? `<tr><td style="padding: 8px 12px; color: #6b7280;"><strong>Reason:</strong></td><td style="padding: 8px 12px; color: #b91c1c;">${customReason || order.cancellation_reason}</td></tr>`
                : ''
            }
          </table>

          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 10px 0;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" bgcolor="#1e1b4b" style="border-radius: 6px;">
                      <a href="${adminLoginUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 13px; font-family: sans-serif; font-weight: bold; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; border: 1px solid #1e1b4b; display: inline-block;">
                        Open Admin Dashboard 🔒
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

    // 7. Dispatch Customer Email
    if (customerEmail && customerEmail.includes('@')) {
      try {
        await resend.emails.send({
          from: FROM_SENDER,
          to: [customerEmail.trim()],
          subject: `Status Update: ${newStatus} - #${order.tracking_id} | Mahin's Store`,
          html: customerStatusHtml,
        })
      } catch (err) {
        console.error('Customer email error:', err)
      }
    }

    // 8. Dispatch Admin Audit Email
    try {
      await resend.emails.send({
        from: FROM_SENDER,
        to: [ADMIN_EMAIL],
        subject: `[STATUS UPDATED] #${order.tracking_id} → ${newStatus} (${customerEmail || 'No Email'})`,
        html: adminStatusHtml,
      })
    } catch (err) {
      console.error('Admin email error:', err)
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      customerEmail: customerEmail || 'None found',
    })
  }	catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}