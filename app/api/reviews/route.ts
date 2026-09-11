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

    // Admin fetch: returns all reviews (approved and pending)
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

    // Public storefront fetch: only returns approved reviews
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_approved', true)
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

    // New reviews default to is_approved: false pending admin approval
    const { error } = await supabase.from('product_reviews').insert([
      { 
        product_id, 
        user_id, 
        customer_name, 
        rating, 
        comment, 
        image_url: image_url || null,
        is_approved: false
      }
    ])

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: 'Review submitted! It will appear publicly after approval.' 
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// Admin toggle approval route (1-click Approve / Unapprove)
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { reviewId, is_approved } = body

    if (!reviewId || typeof is_approved !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Review ID and is_approved status are required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('product_reviews')
      .update({ is_approved })
      .eq('id', reviewId)

    if (error) throw error

    return NextResponse.json({ success: true, message: `Review ${is_approved ? 'approved' : 'hidden'} successfully` })
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