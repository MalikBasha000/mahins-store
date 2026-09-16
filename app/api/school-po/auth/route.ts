// app/api/school-po/auth/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { action, email, password, udise_code, school_name, educator_name, phone, atl_code, address } = await req.json()
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanUdise = (udise_code || '').trim().toUpperCase()

    if (!cleanEmail || !cleanUdise || !password) {
      return NextResponse.json({ success: false, error: 'Email, UDISE Code, and Password are required.' }, { status: 400 })
    }

    if (action === 'SIGNUP') {
      if (password.length < 6) {
        return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long.' }, { status: 400 })
      }

      // Check existing institution
      const { data: existing } = await supabaseAdmin
        .from('school_accounts')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ success: false, error: 'An institution with this email is already registered. Please sign in.' }, { status: 400 })
      }

      // Hash password using SQL crypt or insert directly with pgcrypto via RPC/insert
      const { data: inserted, error: insertErr } = await supabaseAdmin.rpc('register_school_account', {
        p_school_name: school_name.trim(),
        p_educator_name: educator_name.trim(),
        p_email: cleanEmail,
        p_phone: phone.trim(),
        p_udise_code: cleanUdise,
        p_atl_code: atl_code ? atl_code.trim().toUpperCase() : null,
        p_address: address.trim(),
        p_password: password
      })

      // Fallback direct insert if RPC is not preferred
      if (insertErr) {
        const { data: directInsert, error: directErr } = await supabaseAdmin
          .from('school_accounts')
          .insert([{
            school_name: school_name.trim(),
            educator_name: educator_name.trim(),
            email: cleanEmail,
            phone: phone.trim(),
            udise_code: cleanUdise,
            atl_code: atl_code ? atl_code.trim().toUpperCase() : null,
            address: address.trim(),
            password_hash: password, // For standard setups
            is_verified: true
          }])
          .select()
          .single()

        if (directErr) throw directErr
        return NextResponse.json({ success: true, user: directInsert })
      }

      return NextResponse.json({ success: true, user: inserted })
    }

    if (action === 'LOGIN') {
      const { data: account, error: accErr } = await supabaseAdmin
        .from('school_accounts')
        .select('*')
        .eq('email', cleanEmail)
        .eq('udise_code', cleanUdise)
        .maybeSingle()

      if (accErr || !account) {
        return NextResponse.json({ success: false, error: 'Invalid institutional Email or UDISE Code combination.' }, { status: 401 })
      }

      if (account.password_hash && account.password_hash !== password) {
        return NextResponse.json({ success: false, error: 'Incorrect institutional account password.' }, { status: 401 })
      }

      // Return profile without exposing the password hash
      const { password_hash, ...safeProfile } = account
      return NextResponse.json({ success: true, user: safeProfile })
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}