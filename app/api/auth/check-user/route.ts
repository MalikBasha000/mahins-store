// app/api/auth/check-user/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || !email.trim()) {
      return NextResponse.json({ exists: false, error: 'Email is required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Check profiles table
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .ilike('email', email.trim())
      .maybeSingle()

    if (profile) {
      return NextResponse.json({ exists: true })
    }

    // 2. Check orders table
    const { data: orderCustomer } = await supabaseAdmin
      .from('orders')
      .select('customer_email')
      .ilike('customer_email', email.trim())
      .maybeSingle()

    if (orderCustomer) {
      return NextResponse.json({ exists: true })
    }

    return NextResponse.json({ exists: false })
  } catch (err: any) {
    return NextResponse.json({ exists: true }) // Fail open to default auth
  }
}