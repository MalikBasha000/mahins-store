// app/api/admin/customers/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // 1. Fetch all orders
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (ordersErr) {
      return NextResponse.json({ success: false, error: ordersErr.message }, { status: 500 })
    }

    // 2. Fetch all saved customer profile addresses
    const { data: addresses } = await supabaseAdmin
      .from('customer_addresses')
      .select('*')

    // 3. Safely fetch registered auth users (won't crash if unprivileged)
    let authUsers: any[] = []
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
      if (usersData?.users) {
        authUsers = usersData.users
      }
    } catch (e) {
      console.error('Auth admin listUsers skipped or failed:', e)
    }

    const customersMap = new Map<string, any>()
    const emailToUserIdMap = new Map<string, string>()

    // Index registered auth users first
    for (const u of authUsers) {
      const addr = (addresses || []).find((a) => a.user_id === u.id)
      const userEmail = (u.email || '').trim().toLowerCase()
      if (userEmail) {
        emailToUserIdMap.set(userEmail, u.id)
      }
      
      const formattedAddress = addr
        ? [
            addr.house_no ? `House No: ${addr.house_no}` : '',
            addr.plot_no ? `Plot No: ${addr.plot_no}` : '',
            addr.street ? `Street: ${addr.street}` : '',
            addr.city ? `City: ${addr.city}` : '',
            addr.district ? `District: ${addr.district}` : '',
            addr.state ? `State: ${addr.state}` : '',
            addr.pincode ? `Pincode: ${addr.pincode}` : '',
            addr.phone ? `Phone: ${addr.country_code || '+91'} ${addr.phone}` : '',
          ].filter(Boolean).join(', ')
        : 'No dynamic address saved in profile yet'

      customersMap.set(u.id, {
        id: u.id,
        name: addr?.full_name || u.user_metadata?.full_name || 'Registered Customer',
        email: u.email || '',
        phone: addr?.phone ? `${addr.country_code || '+91'} ${addr.phone}` : 'N/A',
        current_profile_address: formattedAddress,
        raw_address: addr || null,
        total_orders_count: 0,
        total_spent: 0,
        order_logs: [],
        created_at: u.created_at,
      })
    }

    // 4. Aggregate EVERY order into customer profiles (matches user_id, email, or groups guests)
    for (const o of orders || []) {
      let snapshot: any = {}
      try {
        snapshot = typeof o.shipping_address_snapshot === 'string'
          ? JSON.parse(o.shipping_address_snapshot || '{}')
          : (o.shipping_address_snapshot || {})
      } catch (err) {
        snapshot = {}
      }

      const resolvedEmail = (
        snapshot.email ||
        snapshot.customer_email ||
        o.customer_email ||
        o.email ||
        ''
      ).trim().toLowerCase()

      let targetKey = o.user_id
      if (!targetKey && resolvedEmail && emailToUserIdMap.has(resolvedEmail)) {
        targetKey = emailToUserIdMap.get(resolvedEmail)
      }
      if (!targetKey) {
        targetKey = resolvedEmail ? `email_${resolvedEmail}` : (o.tracking_id || 'guest_' + o.id)
      }

      let customer = customersMap.get(targetKey)

      if (!customer) {
        // Find if any saved address matches this customer
        const matchingAddr = (addresses || []).find(a => a.user_id === o.user_id)
        
        customer = {
          id: targetKey,
          name: o.customer_name || snapshot.full_name || 'Valued Customer',
          email: resolvedEmail,
          phone: snapshot.phone || o.customer_phone || matchingAddr?.phone || 'N/A',
          current_profile_address: o.shipping_address || 'No dynamic address saved in profile yet',
          raw_address: snapshot || null,
          total_orders_count: 0,
          total_spent: 0,
          order_logs: [],
          created_at: o.created_at,
        }
        customersMap.set(targetKey, customer)
      }

      const orderTotal = Number(o.total_amount || o.final_payable_amount || 0)
      customer.total_orders_count += 1
      if (o.status !== 'Cancelled') {
        customer.total_spent += orderTotal
      }
      customer.order_logs.push(o)
    }

    const customersList = Array.from(customersMap.values()).sort(
      (a, b) => b.total_spent - a.total_spent
    )

    return NextResponse.json({ success: true, customers: customersList })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch customer data' },
      { status: 500 }
    )
  }
}