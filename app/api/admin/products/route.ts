// app/api/admin/products/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing')
  }

  if (!serviceRoleKey) {
    console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables!')
  }

  return createClient(supabaseUrl, serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// POST: Add new product
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([body])
      .select()

    if (error) {
      console.error('Supabase Product Insert Error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, product: data })
  } catch (err: any) {
    console.error('Server error in POST /api/admin/products:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// PUT: Update product
export async function PUT(req: Request) {
  try {
    const { id, ...updates } = await req.json()

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Supabase Product Update Error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Server error in PUT /api/admin/products:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// DELETE: Remove product
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id)

    if (error) {
      console.error('Supabase Product Delete Error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Server error in DELETE /api/admin/products:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}