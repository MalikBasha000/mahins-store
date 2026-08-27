// app/api/send-order-email/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { type, customerEmail, orderDetails, orderId } = await req.json()
    const ADMIN_EMAIL = 'mahinsonestoponestore@gmail.com'
    const FROM_SENDER = "Mahin's One-Stop One-Store <orders@mahinsonestoponestore.in>"
    
    const baseUrl = 'https://www.mahinsonestoponestore.in'
    const adminLoginUrl = 'https://www.mahinsonestoponestore.in/admin'

    // Initialize backend Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Resolve customer email automatically if missing or invalid
    let resolvedCustomerEmail = customerEmail && customerEmail.includes('@') ? customerEmail.trim() : ''

    if (!resolvedCustomerEmail && (orderId || orderDetails?.tracking_id)) {
      const query = supabaseAdmin.from('orders').select('*')
      if (orderId) query.eq('id', orderId)
      else if (orderDetails?.tracking_id) query.eq('tracking_id', orderDetails.tracking_id)

      const { data: dbOrder } = await query.maybeSingle()

      if (dbOrder) {
        resolvedCustomerEmail = 
          dbOrder.customer_email || 
          dbOrder.email || 
          dbOrder.user_email || 
          dbOrder.customerEmail || 
          ''

        // Fallback: If user_id exists, fetch email from auth
        if (!resolvedCustomerEmail && dbOrder.user_id) {
          const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(dbOrder.user_id)
          if (authUserData?.user?.email) {
            resolvedCustomerEmail = authUserData.user.email
          }
        }
      }
    }

    const items = Array.isArray(orderDetails?.items) ? orderDetails.items : []

    const itemsHtml = items.map((item: any) => {
      const itemImg = item.image_url 
        ? item.image_url.split(',')[0].trim() 
        : 'https://via.placeholder.com/80'
      const unitPrice = item.price || 0
      const qty = item.quantity || 1
      const itemSubtotal = unitPrice * qty

      return `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 12px 8px; width: 60px;">
            <img src="${itemImg}" alt="${item.name}" style="width: 54px; height: 54px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; display: block;" />
          </td>
          <td style="padding: 12px 8px;">
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #111827;">${item.name}</p>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280;">Unit Price: ₹${unitPrice}</p>
          </td>
          <td style="padding: 12px 8px; text-align: center; font-size: 13px; color: #374151; font-weight: 600;">
            Qty: ${qty}
          </td>
          <td style="padding: 12px 8px; text-align: right; font-size: 14px; font-weight: bold; color: #111827;">
            ₹${itemSubtotal}
          </td>
        </tr>
      `
    }).join('')

    if (type === 'ORDER_PLACED') {
      const customerHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #312e81; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">Mahin's One-Stop One-Store</h1>
            <p style="color: #c7d2fe; margin: 6px 0 0 0; font-size: 14px;">Order Confirmed & Received!</p>
          </div>

          <div style="padding: 24px;">
            <h2 style="font-size: 16px; color: #111827; margin: 0 0 8px 0;">Hello ${orderDetails.customer_name || 'Valued Customer'},</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
              Thank you for shopping with us! We have received your order and our team is preparing it for shipment.
            </p>

            <div style="background: #f8fafc; border: 1px dashed #c7d2fe; border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 11px; font-weight: bold; color: #4338ca; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Your 16-Digit Tracking ID</span>
              <span style="font-family: monospace; font-size: 18px; font-weight: 800; color: #1e1b4b; letter-spacing: 1.5px;">${orderDetails.tracking_id}</span>
            </div>

            <h3 style="font-size: 14px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0; border-bottom: 2px solid #f3f4f6; padding-bottom: 6px;">Ordered Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              ${itemsHtml || '<tr><td colspan="4" style="padding: 10px; text-align: center; color: #9ca3af;">Standard Order Items</td></tr>'}
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; border-top: 2px solid #f3f4f6;">
              <tr>
                <td style="padding: 10px 0; font-size: 14px; color: #4b5563;">Payment Method:</td>
                <td style="padding: 10px 0; font-size: 14px; font-weight: 600; text-align: right; color: #111827;">${orderDetails.payment_method || 'Online / Cash on Delivery'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 16px; font-weight: bold; color: #111827;">Total Paid Amount:</td>
                <td style="padding: 6px 0; font-size: 18px; font-weight: 800; text-align: right; color: #4338ca;">₹${orderDetails.total_amount}</td>
              </tr>
            </table>

            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin: 24px 0 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 500;">
                To check your complete order details, history, and status updates, please visit our website:
              </p>
            </div>

            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 10px 0;">
              <tr>
                <td align="center">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" bgcolor="#4f46e5" style="border-radius: 8px;">
                        <a href="${baseUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 14px; font-family: sans-serif; font-weight: bold; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; border: 1px solid #4f46e5; display: inline-block;">
                          Visit Website 🌐
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            Mahin's One-Stop One-Store • Need assistance? Reply directly to this email.
          </div>
        </div>
      `

      const adminHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 2px solid #4338ca; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #1e1b4b; padding: 20px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 18px;">🔔 New Customer Order Received!</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #a5b4fc;">A customer just completed checkout on your store.</p>
          </div>

          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 13px;">
              <tr>
                <td style="padding: 6px 12px; color: #6b7280;"><strong>Customer Name:</strong></td>
                <td style="padding: 6px 12px; color: #111827; font-weight: bold;">${orderDetails.customer_name || 'Guest'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 12px; color: #6b7280;"><strong>Customer Email:</strong></td>
                <td style="padding: 6px 12px; color: #111827;">${resolvedCustomerEmail || 'No email provided'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 12px; color: #6b7280;"><strong>Tracking ID:</strong></td>
                <td style="padding: 6px 12px; font-family: monospace; font-weight: bold; color: #4338ca;">${orderDetails.tracking_id}</td>
              </tr>
              <tr>
                <td style="padding: 6px 12px; color: #6b7280;"><strong>Total Revenue:</strong></td>
                <td style="padding: 6px 12px; font-weight: 800; color: #047857; font-size: 15px;">₹${orderDetails.total_amount}</td>
              </tr>
              <tr>
                <td style="padding: 6px 12px; color: #6b7280;"><strong>Payment Method:</strong></td>
                <td style="padding: 6px 12px; color: #111827;">${orderDetails.payment_method || 'Online'}</td>
              </tr>
            </table>

            <h3 style="font-size: 14px; color: #374151; text-transform: uppercase; margin: 0 0 8px 0; border-bottom: 2px solid #f3f4f6; padding-bottom: 6px;">Delivery Address</h3>
            <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 8px; padding: 12px; font-size: 13px; color: #831843; line-height: 1.5; margin-bottom: 20px;">
              ${orderDetails.shipping_address || 'No address specified'}
            </div>

            <h3 style="font-size: 14px; color: #374151; text-transform: uppercase; margin: 0 0 8px 0; border-bottom: 2px solid #f3f4f6; padding-bottom: 6px;">Ordered Items Calculation</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              ${itemsHtml || '<tr><td colspan="4" style="padding: 10px; text-align: center; color: #9ca3af;">Item details available in dashboard</td></tr>'}
            </table>

            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 10px 0;">
              <tr>
                <td align="center">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" bgcolor="#1e1b4b" style="border-radius: 6px;">
                        <a href="${adminLoginUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 13px; font-family: sans-serif; font-weight: bold; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; border: 1px solid #1e1b4b; display: inline-block;">
                          Admin Login 🔒
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

      if (resolvedCustomerEmail) {
        try {
          await resend.emails.send({
            from: FROM_SENDER,
            to: [resolvedCustomerEmail],
            subject: `Order Confirmation - #${orderDetails.tracking_id} | Mahin's One-Stop One-Store`,
            html: customerHtml,
          })
        } catch (e) {
          console.error('Customer email send error:', e)
        }
      }

      try {
        await resend.emails.send({
          from: FROM_SENDER,
          to: [ADMIN_EMAIL],
          subject: `🚨 [NEW ORDER] ₹${orderDetails.total_amount} - #${orderDetails.tracking_id} (${orderDetails.customer_name})`,
          html: adminHtml,
        })
      } catch (e) {
        console.error('Admin email send error:', e)
      }

    } else if (type === 'STATUS_UPDATE') {
      const statusHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #312e81; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Mahin's One-Stop One-Store</h2>
            <p style="color: #c7d2fe; margin: 4px 0 0 0; font-size: 13px;">Shipment Status Update</p>
          </div>

          <div style="padding: 24px;">
            <p style="font-size: 14px; color: #374151; margin: 0 0 16px 0;">
              Your order status has been updated for Tracking ID: 
              <strong style="font-family: monospace; color: #1e1b4b;">${orderDetails.tracking_id}</strong>
            </p>
            
            <div style="background: #eef2ff; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 14px 18px; margin: 16px 0;">
              <span style="font-size: 12px; color: #4b5563; text-transform: uppercase; font-weight: bold; display: block;">Current Status</span>
              <span style="font-size: 18px; font-weight: 800; color: #4338ca;">${orderDetails.status}</span>
              ${
                orderDetails.reason
                  ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #b91c1c;"><strong>Details:</strong> ${orderDetails.reason}</p>`
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

      // 1. Send status update to customer
      if (resolvedCustomerEmail) {
        try {
          await resend.emails.send({
            from: FROM_SENDER,
            to: [resolvedCustomerEmail],
            subject: `Status Update: ${orderDetails.status} - #${orderDetails.tracking_id} | Mahin's Store`,
            html: statusHtml,
          })
        } catch (e) {
          console.error('Failed sending status email to customer:', e)
        }
      }

      // 2. Send status confirmation to admin
      try {
        await resend.emails.send({
          from: FROM_SENDER,
          to: [ADMIN_EMAIL],
          subject: `[STATUS UPDATED] #${orderDetails.tracking_id} → ${orderDetails.status}`,
          html: statusHtml,
        })
      } catch (e) {
        console.error('Failed sending status email to admin:', e)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Emails processed', 
      customerSentTo: resolvedCustomerEmail 
    })
  } catch (error: any) {
    console.error('Email Dispatch Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch email' },
      { status: 500 }
    )
  }
}