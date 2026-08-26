// app/api/auth/check-user/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || !email.trim()) {
      return NextResponse.json({ exists: false, error: 'Email is required' }, { status: 400 })
    }

    const targetEmail = email.trim().toLowerCase()

    // Initialize Supabase with service role key or anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Try checking Supabase Auth system users if service role key is available
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
      if (!userError && userData?.users) {
        const found = userData.users.some(u => u.email?.toLowerCase() === targetEmail)
        if (found) {
          return NextResponse.json({ exists: true })
        }
      }
    } catch {
      // If service role not configured, fallback to standard lookup
    }

    // 2. Check public tables (profiles, customers, orders)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .ilike('email', targetEmail)
      .maybeSingle()

    if (profile) {
      return NextResponse.json({ exists: true })
    }

    const { data: orderCustomer } = await supabase
      .from('orders')
      .select('customer_email')
      .ilike('customer_email', targetEmail)
      .maybeSingle()

    if (orderCustomer) {
      return NextResponse.json({ exists: true })
    }

    // Default: allow Supabase auth to process the reset directly so valid users aren't blocked
    return NextResponse.json({ exists: true })
  } catch (err: any) {
    return NextResponse.json({ exists: true })
  }
}