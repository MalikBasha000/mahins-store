// app/api/admin/low-stock-alert/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST() {
  try {
    const ADMIN_EMAIL = 'mahinsonestoponestore@gmail.com'

    // 1. Fetch products with stock <= 5
    const { data: lowStockItems, error } = await supabase
      .from('products')
      .select('id, name, stock, price, category')
      .lte('stock', 5)
      .order('stock', { ascending: true })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    if (!lowStockItems || lowStockItems.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All inventory is adequately stocked (> 5 units).' 
      })
    }

    // 2. Setup Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || ADMIN_EMAIL,
        pass: process.env.EMAIL_PASS, // 16-digit Gmail App Password
      },
    })

    // 3. Format product rows
    const itemsHtml = lowStockItems
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px; font-weight: bold; color: #111827;">${item.name}</td>
          <td style="padding: 10px; color: #4b5563;">${item.category || 'General'}</td>
          <td style="padding: 10px; font-weight: bold; color: ${item.stock === 0 ? '#dc2626' : '#ea580c'};">
            ${item.stock === 0 ? 'OUT OF STOCK (0)' : `${item.stock} left`}
          </td>
          <td style="padding: 10px; color: #111827;">₹${item.price}</td>
        </tr>`
      )
      .join('')

    // 4. Send Email Alert
    await transporter.sendMail({
      from: `"Mahin's Store Alert" <${process.env.EMAIL_USER || ADMIN_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `⚠️ Warehouse Alert: ${lowStockItems.length} Products Low or Out of Stock!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #312e81; margin-bottom: 4px;">Mahin's One-Stop One-Store</h2>
          <h3 style="color: #b91c1c; margin-top: 0;">⚠️ Low Stock Inventory Alert</h3>
          <p style="color: #374151; font-size: 14px;">The following components in your store warehouse have dropped to 5 units or less:</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0;">
            <thead>
              <tr style="background-color: #f3f4f6; text-align: left;">
                <th style="padding: 8px;">Product</th>
                <th style="padding: 8px;">Category</th>
                <th style="padding: 8px;">Stock</th>
                <th style="padding: 8px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
            Please re-order supplies to prevent checkout stockouts.
          </p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: `Alert successfully sent to ${ADMIN_EMAIL}!`,
      count: lowStockItems.length,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}