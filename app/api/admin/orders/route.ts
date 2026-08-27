// app/api/admin/orders/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Ensure every order has a resolved customer_email
    const resolvedOrders = await Promise.all(
      (orders || []).map(async (order) => {
        let email =
          order.customer_email ||
          order.email ||
          order.user_email ||
          order.customerEmail ||
          ''

        // If no email column, fetch from auth.users via user_id
        if (!email && order.user_id) {
          try {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(order.user_id)
            if (userData?.user?.email) {
              email = userData.user.email
            }
          } catch (e) {
            console.error('Error resolving user email:', e)
          }
        }

        return {
          ...order,
          customer_email: email,
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