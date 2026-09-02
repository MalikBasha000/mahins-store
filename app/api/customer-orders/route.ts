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

    // Query orders matching user_id OR customer_email
    let query = supabaseAdmin.from('orders').select('*')

    if (userId && email) {
      query = query.or(`user_id.eq.${userId},customer_email.ilike.${email}`)
    } else if (userId) {
      query = query.eq('user_id', userId)
    } else if (email) {
      query = query.ilike('customer_email', email)
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    // Automatically claim/link any unassigned guest orders to this user ID
    if (userId && orders) {
      const unclaimedIds = orders.filter(o => !o.user_id).map(o => o.id)
      if (unclaimedIds.length > 0) {
        await supabaseAdmin
          .from('orders')
          .update({ user_id: userId })
          .in('id', unclaimedIds)
      }
    }

    return NextResponse.json({ success: true, orders: orders || [] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}