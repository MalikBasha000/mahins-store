// app/api/settings/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'payment_config')
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({
      success: true,
      settings: data || {
        is_razorpay_enabled: true,
        is_upi_enabled: true,
        is_cod_enabled: true,
        cod_message: 'Payments not accepting currently'
      }
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('store_settings')
      .upsert({ id: 'payment_config', ...body })

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Payment settings updated successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}