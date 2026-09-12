// app/api/admin/bundles/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
}

// GET: Fetch all bundle recipes mapping
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from('bundle_items').select('*')
    if (error) throw error
    return NextResponse.json({ success: true, bundleItems: data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// POST / PUT: Save or update bundle recipe components
export async function POST(req: Request) {
  try {
    const { bundleId, components } = await req.json()

    if (!bundleId || !Array.isArray(components)) {
      return NextResponse.json({ success: false, error: 'Invalid payload provided.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Clear existing recipe items for this bundle
    await supabase.from('bundle_items').delete().eq('bundle_id', bundleId)

    // Insert new components if any
    if (components.length > 0) {
      const payload = components.map((c: any) => ({
        bundle_id: bundleId,
        component_id: c.component_id,
        quantity: Math.max(1, Number(c.quantity) || 1)
      }))

      const { error: insertErr } = await supabase.from('bundle_items').insert(payload)
      if (insertErr) throw insertErr
    }

    return NextResponse.json({ success: true, message: 'Bundle recipe updated successfully via API.' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}