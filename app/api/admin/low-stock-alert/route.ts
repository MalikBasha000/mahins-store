// app/api/admin/low-stock-alert/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch products with stock <= 5
    const { data: lowStockProducts, error } = await supabase
      .from('products')
      .select('*')
      .lte('stock', 5)
      .order('stock', { ascending: true })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      count: lowStockProducts?.length || 0,
      products: lowStockProducts || []
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}