// app/school-po/auth/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { useSchoolPOCart } from '../../context/SchoolPOCartContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SchoolPOAuth() {
  const [isLogin, setIsLogin] = useState(false)
  const [schoolName, setSchoolName] = useState('')
  const [educatorName, setEducatorName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [udiseCode, setUdiseCode] = useState('')
  const [atlCode, setAtlCode] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { setSchoolUser } = useSchoolPOCart()
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const payload = {
        school_name: schoolName.trim(),
        educator_name: educatorName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        udise_code: udiseCode.trim().toUpperCase(),
        atl_code: atlCode.trim().toUpperCase() || null,
        address: address.trim(),
        is_verified: true
      }

      const { data, error } = await supabase
        .from('school_accounts')
        .insert([payload])
        .select()
        .single()

      if (error) {
        if (error.message.includes('unique constraint')) {
          throw new Error('An institution with this email is already registered. Please sign in.')
        }
        throw error
      }

      setSchoolUser(data)
      router.push('/school-po')
    } catch (err: any) {
      setErrorMsg(err.message)
    }
    setLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { data, error } = await supabase
        .from('school_accounts')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('udise_code', udiseCode.trim().toUpperCase())
        .single()

      if (error || !data) {
        throw new Error('Invalid institutional email or UDISE code combination.')
      }

      setSchoolUser(data)
      router.push('/school-po')
    } catch (err: any) {
      setErrorMsg(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F4EADE] flex flex-col items-center justify-center p-4 text-[#2B2B2B]">
      <div className="w-full max-w-xl bg-[#EFE3D3] rounded-3xl p-6 sm:p-8 border border-[#8A7968]/30 shadow-xl space-y-6">
        <div className="text-center space-y-1 border-b border-[#8A7968]/20 pb-4">
          <div className="text-3xl">🏛️</div>
          <h1 className="text-xl sm:text-2xl font-black">
            {isLogin ? 'Institutional PO Login' : 'School PO Verification & Registration'}
          </h1>
          <p className="text-xs text-[#8A7968]">
            {isLogin 
              ? 'Sign in using your institutional email & registered UDISE code' 
              : 'Register your school or Atal Tinkering Lab to unlock institutional bulk pricing'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
            {errorMsg}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">Official School Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="educator@school.edu.in"
                className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">School UDISE Code *</label>
              <input
                type="text"
                required
                value={udiseCode}
                onChange={(e) => setUdiseCode(e.target.value)}
                placeholder="e.g. 36010100101"
                className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs font-mono uppercase focus:border-[#B76E79] focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition cursor-pointer btn-press"
            >
              {loading ? 'Verifying...' : 'Access School PO Portal 🏛️'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold mb-1">School / Institution Name *</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Govt High School Bolaram"
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">Educator / Incharge Name *</label>
                <input
                  type="text"
                  required
                  value={educatorName}
                  onChange={(e) => setEducatorName(e.target.value)}
                  placeholder="e.g. ATL Lab Incharge"
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="incharge@school.edu.in"
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">School UDISE Code *</label>
                <input
                  type="text"
                  required
                  value={udiseCode}
                  onChange={(e) => setUdiseCode(e.target.value)}
                  placeholder="11-digit UDISE Code"
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs font-mono uppercase focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">ATL Code (Optional)</label>
                <input
                  type="text"
                  value={atlCode}
                  onChange={(e) => setAtlCode(e.target.value)}
                  placeholder="e.g. ATL-123456"
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs font-mono uppercase focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1">School Delivery Address *</label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full delivery address with pincode..."
                className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition cursor-pointer btn-press"
            >
              {loading ? 'Verifying & Registering...' : 'Verify Details & Enter Portal 🚀'}
            </button>
          </form>
        )}

        <div className="flex justify-between items-center text-xs pt-2 border-t border-[#8A7968]/20">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
            className="text-[#B76E79] font-bold hover:underline cursor-pointer"
          >
            {isLogin ? '← New School? Register here' : 'Already registered? Sign In'}
          </button>
          <Link href="/" className="text-[#8A7968] font-bold hover:underline">
            Return to Store
          </Link>
        </div>
      </div>
    </div>
  )
}