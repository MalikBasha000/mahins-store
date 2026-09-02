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
    let email = searchParams.get('email')?.trim().toLowerCase()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 1. Fallback: If email wasn't passed via query params, fetch it directly from Auth Admin
    if (!email) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (userData?.user?.email) {
          email = userData.user.email.trim().toLowerCase()
        }
      } catch (e) {
        console.error('Error fetching user email from admin:', e)
      }
    }

    // 2. Fetch all orders from the database
    const { data: allOrders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // 3. Multi-layer matching to catch guest orders securely
    const matchedOrders = (allOrders || []).filter(o => {
      // Direct user ID match
      if (o.user_id === userId) return true

      // Parse snapshot safely
      let snapshot: any = {}
      try {
        snapshot = typeof o.shipping_address_snapshot === 'string'
          ? JSON.parse(o.shipping_address_snapshot || '{}')
          : (o.shipping_address_snapshot || {})
      } catch (err) {
        snapshot = {}
      }

      const orderEmail = (o.customer_email || snapshot.email || snapshot.customer_email || '').trim().toLowerCase()
      const shippingAddressText = (o.shipping_address || '').toLowerCase()

      // Match if email matches top-level/snapshot OR if the email text appears inside the shipping address string
      if (email && (orderEmail === email || shippingAddressText.includes(email))) {
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