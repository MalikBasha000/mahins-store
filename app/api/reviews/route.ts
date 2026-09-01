// app/api/reviews/route.ts
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
    const productId = searchParams.get('product_id')
    const adminFetch = searchParams.get('admin_fetch')

    const supabase = getSupabaseAdmin()

    if (adminFetch === 'true') {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, products(name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return NextResponse.json({ success: true, reviews: data || [] })
    }

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, reviews: data || [] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { product_id, user_id, customer_name, rating, comment, image_url } = body

    if (!product_id || !user_id || !rating || !comment) {
      return NextResponse.json({ success: false, error: 'Missing required review fields' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    
    // Check if user has already reviewed this product to enforce one review per product
    const { data: existing } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('product_id', product_id)
      .eq('user_id', user_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: false, error: 'You have already submitted a review for this product.' }, { status: 400 })
    }

    const { error } = await supabase.from('product_reviews').insert([
      { product_id, user_id, customer_name, rating, comment, image_url: image_url || null }
    ])

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Review added successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { reviewId, rating, comment, image_url } = body

    if (!reviewId) {
      return NextResponse.json({ success: false, error: 'Review ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('product_reviews')
      .update({ rating, comment, image_url: image_url || null })
      .eq('id', reviewId)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Review updated successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const reviewId = searchParams.get('id')

    if (!reviewId) {
      return NextResponse.json({ success: false, error: 'Review ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', reviewId)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Review deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}