// app/signup/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [enteredOtp, setEnteredOtp] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)
    const uniqueOtp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(uniqueOtp)

    try {
      const res = await fetch('/api/customer-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: uniqueOtp })
      })

      const data = await res.json()
      if (data.success) {
        setSuccessMsg(`Verification code sent successfully to ${email.trim()}!`)
        setStep('otp')
      } else {
        setErrorMsg(data.error || 'Failed to dispatch verification email.')
      }
    } catch (err: any) {
      setErrorMsg(`Network error: ${err.message}`)
    }
    setLoading(false)
  }

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (enteredOtp.trim() !== generatedOtp) {
      setErrorMsg('Invalid OTP token. Please check your inbox and try again.')
      return
    }

    setLoading(true)

    try {
      const cleanEmail = email.trim().toLowerCase()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      })

      if (authError) throw authError

      const userId = authData.user?.id
      if (userId) {
        // Robustly claim all past guest orders matching this email
        const { error: claimError } = await supabase
          .from('orders')
          .update({ user_id: userId })
          .eq('customer_email', cleanEmail)

        if (claimError) {
          console.error('Error claiming past orders:', claimError.message)
        }

        await supabase.from('customer_addresses').upsert({
          user_id: userId,
          full_name: fullName.trim(),
          email: cleanEmail,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      }

      setSuccessMsg('Account created & past orders linked successfully!')
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4EADE] p-4 sm:p-6 text-[#2B2B2B]">
      <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-[#EFE3D3] p-6 sm:p-8 shadow-xs border border-[#8A7968]/30">
        {/* Store Branding Header */}
        <div className="text-center mb-6 pb-4 border-b border-[#8A7968]/20">
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-black text-[#2B2B2B] tracking-tight">
              Mahin's One-Stop One-Store
            </h1>
          </Link>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-[#2B2B2B] text-center mb-1">
          {step === 'form' ? 'Create an Account' : 'Verify Your Email'}
        </h2>
        <p className="text-xs text-[#8A7968] text-center mb-6">
          {step === 'form' ? 'Sign up to sync your guest orders and track purchases' : 'Enter the 6-digit code sent to your email'}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-xs font-semibold border border-red-200">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-xl text-xs font-semibold border border-green-200">
            {successMsg}
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#8A7968] hover:text-[#2B2B2B] focus:outline-hidden text-base cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-[#8A7968] hover:text-[#2B2B2B] focus:outline-hidden text-base cursor-pointer"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#B76E79] hover:bg-[#9E5B65] py-3 font-bold text-white transition disabled:opacity-50 text-xs sm:text-sm shadow-xs cursor-pointer btn-press"
            >
              {loading ? 'Sending OTP...' : 'Continue to Verification →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister} className="space-y-4">
            <div className="bg-[#EADBC8]/70 border border-[#8A7968]/30 p-4 rounded-xl text-center mb-2">
              <p className="text-xs text-[#2B2B2B] font-medium">
                A verification code was sent to <span className="font-bold text-[#B76E79]">{email}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Enter 6-Digit OTP Token</label>
              <input
                type="text"
                required
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="123456"
                className="w-full rounded-xl border border-[#B76E79]/50 bg-[#F4EADE] p-3 text-center text-lg font-bold tracking-widest text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#B76E79] hover:bg-[#9E5B65] py-3 font-bold text-white transition disabled:opacity-50 text-xs sm:text-sm shadow-xs cursor-pointer btn-press"
            >
              {loading ? 'Verifying & Linking Orders...' : 'Verify Email & Create Account ✓'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('form'); setEnteredOtp(''); }}
              className="w-full text-xs text-[#8A7968] hover:underline mt-2 text-center block cursor-pointer"
            >
              ← Edit Account Details
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-[#8A7968] border-t border-[#8A7968]/20 pt-4">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#B76E79] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}