// app/api/customer-orders/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')?.trim().toLowerCase()

    if (!userId && !email) {
      return NextResponse.json({ success: false, error: 'Missing user credentials' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Fetch all orders to evaluate matching safely on the server side
    const { data: allOrders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Filter orders belonging to this user ID or matching their email address
    const matchedOrders = (allOrders || []).filter(o => {
      if (o.user_id === userId) return true

      const snapshot = typeof o.shipping_address_snapshot === 'string'
        ? JSON.parse(o.shipping_address_snapshot || '{}')
        : (o.shipping_address_snapshot || {})

      const orderEmail = (o.customer_email || snapshot.email || snapshot.customer_email || '').trim().toLowerCase()

      if (!o.user_id && email && orderEmail === email) {
        return true
      }

      return false
    })

    // Automatically claim/link any unassigned guest orders matching this email
    if (userId && email) {
      const unclaimedIds = matchedOrders.filter(o => !o.user_id).map(o => o.id)
      if (unclaimedIds.length > 0) {
        await supabaseAdmin
          .from('orders')
          .update({ user_id: userId })
          .in('id', unclaimedIds)
      }
    }

    return NextResponse.json({ success: true, orders: matchedOrders })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}