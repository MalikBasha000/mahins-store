// app/school-po/auth/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { useSchoolPOCart } from '../../context/SchoolPOCartContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '../../components/Logo'

export default function SchoolPOAuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [schoolName, setSchoolName] = useState('')
  const [educatorName, setEducatorName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [udiseCode, setUdiseCode] = useState('')
  const [atlCode, setAtlCode] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { setSchoolUser } = useSchoolPOCart()
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      setLoading(false)
      return
    }

    try {
      const payload = {
        school_name: schoolName.trim(),
        educator_name: educatorName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        udise_code: udiseCode.trim().toUpperCase(),
        atl_code: atlCode.trim().toUpperCase() || null,
        address: address.trim(),
        password_hash: password,
        is_verified: true
      }

      const { data, error } = await supabase
        .from('school_accounts')
        .insert([payload])
        .select()
        .single()

      if (error) {
        if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
          throw new Error('An institution with this email is already registered. Please click "Sign In".')
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
        throw new Error('No verified institution found matching this Email and UDISE Code.')
      }

      // Check password if account has one configured
      if (data.password_hash && data.password_hash !== password) {
        throw new Error('Incorrect password for this institutional account.')
      }

      // If legacy account had no password yet, assign this password to secure it
      if (!data.password_hash && password) {
        await supabase
          .from('school_accounts')
          .update({ password_hash: password })
          .eq('id', data.id)
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
        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center space-y-2.5 border-b border-[#8A7968]/20 pb-4">
          <Logo size={54} variant="icon" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black">
              {isLogin ? 'School PO Verification Login' : 'School PO Verification & Signup'}
            </h1>
            <p className="text-xs text-[#8A7968] mt-1">
              {isLogin 
                ? 'Access institutional bulk pricing with your registered Email, UDISE Code, and Password.'
                : 'Register your school or Atal Tinkering Lab to verify bulk discount eligibility.'}
            </p>
          </div>
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
                placeholder="incharge@school.edu.in"
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
                placeholder="11-digit UDISE Code"
                className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs font-mono uppercase focus:border-[#B76E79] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Account Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password..."
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-[10px] font-bold text-[#8A7968] hover:text-[#2B2B2B] bg-[#EADBC8] border border-[#8A7968]/30 px-2 py-0.5 rounded-md cursor-pointer"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition cursor-pointer btn-press mt-2 shadow-xs"
            >
              {loading ? 'Verifying...' : 'Login & Open School PO Portal'}
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
                  placeholder="e.g. Kendriya Vidyalaya / Govt High School"
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">Educator / Lab Incharge *</label>
                <input
                  type="text"
                  required
                  value={educatorName}
                  onChange={(e) => setEducatorName(e.target.value)}
                  placeholder="e.g. Science / ATL Lead"
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">School Official Email *</label>
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
                <label className="block text-[11px] font-bold mb-1">UDISE Code *</label>
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
                  placeholder="e.g. ATL-098231"
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs font-mono uppercase focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Create Account Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose password (min 6 characters)..."
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-[10px] font-bold text-[#8A7968] hover:text-[#2B2B2B] bg-[#EADBC8] border border-[#8A7968]/30 px-2 py-0.5 rounded-md cursor-pointer"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1">School Campus Delivery Address *</label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Complete street address, district, state & pincode..."
                className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition cursor-pointer btn-press mt-2 shadow-xs"
            >
              {loading ? 'Submitting Details...' : 'Verify & Enter School PO Portal 🚀'}
            </button>
          </form>
        )}

        <div className="flex justify-between items-center text-xs pt-2 border-t border-[#8A7968]/20">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
            className="text-[#B76E79] font-bold hover:underline cursor-pointer"
          >
            {isLogin ? '← Register new school' : 'Already registered? Sign In'}
          </button>
          <Link href="/" className="text-[#8A7968] font-bold hover:underline">
            Return to Store
          </Link>
        </div>
      </div>
    </div>
  )
}