// app/api/admin/products/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Server misconfiguration: NEXT_PUBLIC_SUPABASE_URL is missing.')
  }

  if (!serviceKey) {
    throw new Error(
      'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY is missing from Vercel Environment Variables. Please add the secret key in Project Settings -> API.'
    )
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// POST: Add new product or kit (Bypasses RLS with service_role)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { components, ...productData } = body
    const supabaseAdmin = getSupabaseAdmin()

    // 1. Insert product/bundle record
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([productData])
      .select()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const newProd = data?.[0]

    // 2. If it's a kit/bundle, save its component recipe in bundle_items
    if (productData.is_bundle && newProd && Array.isArray(components) && components.length > 0) {
      const recipePayload = components.map((c: any) => ({
        bundle_id: newProd.id,
        component_id: c.component_id,
        quantity: Math.max(1, Number(c.quantity) || 1)
      }))

      const { error: bundleErr } = await supabaseAdmin.from('bundle_items').insert(recipePayload)
      if (bundleErr) {
        return NextResponse.json({ success: false, error: `Bundle recipe error: ${bundleErr.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, product: data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// PUT: Update product or kit recipe
export async function PUT(req: Request) {
  try {
    const { id, components, ...updates } = await req.json()

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required.' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // If it's a bundle, update recipe mapping
    if (updates.is_bundle !== undefined) {
      await supabaseAdmin.from('bundle_items').delete().eq('bundle_id', id)
      
      if (updates.is_bundle && Array.isArray(components) && components.length > 0) {
        const newRecipe = components.map((c: any) => ({
          bundle_id: id,
          component_id: c.component_id,
          quantity: Math.max(1, Number(c.quantity) || 1)
        }))
        await supabaseAdmin.from('bundle_items').insert(newRecipe)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// DELETE: Remove product or kit
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required.' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    
    // Deleting bundle_items is handled automatically by ON DELETE CASCADE if configured, 
    // but we can also explicitly clear them or let Supabase cascade.
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}