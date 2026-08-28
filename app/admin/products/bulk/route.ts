// app/api/admin/products/bulk/route.ts
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

export async function POST(req: Request) {
  try {
    const { products } = await req.json()

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid products provided for bulk import.' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Clean and structure the payload
    const sanitizedProducts = products.map((p: any) => ({
      name: (p.name || '').trim(),
      price: parseFloat(p.price) || 0,
      stock: parseInt(p.stock) || 0,
      category: (p.category || 'General').trim(),
      description: (p.description || '').trim(),
      image_url: (p.image_url || '').trim(),
      created_at: new Date().toISOString(),
    })).filter((p: any) => p.name.length > 0)

    if (sanitizedProducts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Products array had no valid product names.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(sanitizedProducts)
      .select()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: data ? data.length : sanitizedProducts.length,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Bulk import failed.' },
      { status: 500 }
    )
  }
}