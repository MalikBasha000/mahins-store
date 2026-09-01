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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
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
        await supabase.from('customer_addresses').upsert({
          user_id: userId,
          full_name: fullName.trim(),
          email: email.trim(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      }

      setSuccessMsg('Account created and verified successfully!')
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {/* Store Branding Header */}
        <div className="text-center mb-6 pb-4 border-b">
          <h1 className="text-2xl font-black text-indigo-900">Mahin's One-Stop One-Store</h1>
        </div>

        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          {step === 'form' ? 'Create an Account' : 'Verify Your Email'}
        </h2>
        <p className="text-xs text-gray-500 text-center mb-6">
          {step === 'form' ? 'Sign up to start shopping and tracking orders' : 'Enter the 6-digit code sent to your email'}
        </p>

        {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">{errorMsg}</div>}
        {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">{successMsg}</div>}

        {step === 'form' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-indigo-600 focus:outline-none text-base cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-indigo-600 focus:outline-none text-base cursor-pointer"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50 text-sm shadow cursor-pointer"
            >
              {loading ? 'Sending OTP...' : 'Continue to Verification →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister} className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-xl text-center mb-2">
              <p className="text-xs text-indigo-900 font-medium">A verification code was sent to <span className="font-bold">{email}</span></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Enter 6-Digit OTP Token</label>
              <input
                type="text"
                required
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="123456"
                className="w-full rounded-lg border border-indigo-300 bg-indigo-50/50 p-3 text-center text-lg font-bold tracking-widest text-indigo-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-600 py-3 font-bold text-white hover:bg-green-700 transition disabled:opacity-50 text-sm shadow cursor-pointer"
            >
              {loading ? 'Verifying & Registering...' : 'Verify Email & Create Account ✓'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('form'); setEnteredOtp(''); }}
              className="w-full text-xs text-gray-500 hover:underline mt-2 text-center block cursor-pointer"
            >
              ← Edit Account Details
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}