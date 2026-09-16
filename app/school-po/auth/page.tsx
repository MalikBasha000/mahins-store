// app/school-po/auth/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { useSchoolPOCart } from '../../context/SchoolPOCartContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '../../components/Logo'

export default function SchoolPOAuthPage() {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD'>('LOGIN')
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
  const [successMsg, setSuccessMsg] = useState('')
  const [activeResetLink, setActiveResetLink] = useState('')

  const { setSchoolUser } = useSchoolPOCart()
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

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
    setSuccessMsg('')

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

      if (data.password_hash && data.password_hash !== password) {
        throw new Error('Incorrect password for this institutional account.')
      }

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    setActiveResetLink('')

    try {
      const res = await fetch('/api/school-po/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_RESET',
          email: email.trim()
        })
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to dispatch password reset link.')
      }

      setSuccessMsg(data.message || 'Password reset link generated!')
      if (data.resetLink) {
        setActiveResetLink(data.resetLink)
      }
    } catch (err: any) {
      setErrorMsg(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F4EADE] flex flex-col items-center justify-center p-4 text-[#2B2B2B]">
      <div className="w-full max-w-xl bg-[#EFE3D3] rounded-3xl p-6 sm:p-8 border border-[#8A7968]/30 shadow-xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-2.5 border-b border-[#8A7968]/20 pb-4">
          <Logo size={54} variant="icon" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black">
              {authMode === 'LOGIN' && 'School PO Verification Login'}
              {authMode === 'SIGNUP' && 'School PO Verification & Signup'}
              {authMode === 'FORGOT_PASSWORD' && 'Reset Institutional Password'}
            </h1>
            <p className="text-xs text-[#8A7968] mt-1">
              {authMode === 'LOGIN' && 'Access institutional bulk pricing with your registered Email, UDISE Code, and Password.'}
              {authMode === 'SIGNUP' && 'Register your school or Atal Tinkering Lab to verify bulk discount eligibility.'}
              {authMode === 'FORGOT_PASSWORD' && 'Enter your registered official email to generate a secure password reset link.'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-green-100 border border-green-300 text-green-800 text-xs rounded-xl font-bold space-y-2.5">
            <div>✓ {successMsg}</div>
            {activeResetLink && (
              <div className="pt-2 border-t border-green-200 flex flex-col gap-2">
                <a
                  href={activeResetLink}
                  className="bg-[#B76E79] hover:bg-[#9E5B65] text-white text-center py-2.5 px-4 rounded-xl font-black text-xs transition shadow-xs block"
                >
                  Proceed to Reset Password Page Now 🔑
                </a>
              </div>
            )}
          </div>
        )}

        {authMode === 'LOGIN' && (
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
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold">Account Password *</label>
                <button
                  type="button"
                  onClick={() => { setAuthMode('FORGOT_PASSWORD'); setErrorMsg(''); setSuccessMsg(''); setActiveResetLink(''); }}
                  className="text-[11px] font-bold text-[#B76E79] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
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
        )}

        {authMode === 'FORGOT_PASSWORD' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">Registered Official School Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="incharge@school.edu.in"
                className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition cursor-pointer btn-press mt-2 shadow-xs"
            >
              {loading ? 'Processing Request...' : 'Send / Generate Password Reset Link ✉️'}
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('LOGIN'); setErrorMsg(''); setSuccessMsg(''); setActiveResetLink(''); }}
              className="w-full text-center text-xs font-bold text-[#8A7968] hover:underline block pt-2"
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {authMode === 'SIGNUP' && (
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
            onClick={() => {
              setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')
              setErrorMsg('')
              setSuccessMsg('')
              setActiveResetLink('')
            }}
            className="text-[#B76E79] font-bold hover:underline cursor-pointer"
          >
            {authMode === 'LOGIN' ? '← Register new school' : 'Already registered? Sign In'}
          </button>
          <Link href="/" className="text-[#8A7968] font-bold hover:underline">
            Return to Store
          </Link>
        </div>
      </div>
    </div>
  )
}