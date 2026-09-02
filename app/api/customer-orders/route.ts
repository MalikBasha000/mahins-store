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

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 1. Get the user's registered email directly from Supabase Auth Admin
    let userEmail = ''
    try {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (userData?.user?.email) {
        userEmail = userData.user.email.trim().toLowerCase()
      }
    } catch (e) {
      console.error('Error fetching user email from admin:', e)
    }

    // 2. Fetch all orders from the database
    const { data: allOrders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // 3. Find matching orders (either matching user_id OR matching email)
    const matchedOrders = (allOrders || []).filter(o => {
      if (o.user_id === userId) return true

      const snapshot = typeof o.shipping_address_snapshot === 'string'
        ? JSON.parse(o.shipping_address_snapshot || '{}')
        : (o.shipping_address_snapshot || {})

      const orderEmail = (o.customer_email || snapshot.email || snapshot.customer_email || '').trim().toLowerCase()

      if (userEmail && orderEmail === userEmail) {
        return true
      }

      return false
    })

    // 4. Automatically claim/link any unassigned guest orders to this user ID
    if (userId) {
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