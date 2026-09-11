// app/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotError, setForgotError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotMsg('')
    setForgotError('')

    const targetEmail = forgotEmail.trim().toLowerCase()
    if (!targetEmail) {
      setForgotError('Please enter your account email address.')
      return
    }

    setForgotLoading(true)

    try {
      const checkRes = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      })
      const checkData = await checkRes.json()

      if (!checkData.exists) {
        setForgotError('No account found with this email address. Please sign up to create a new account.')
        setForgotLoading(false)
        return
      }

      const redirectUrl = typeof window !== 'undefined' && window.location.origin.includes('mahinsonestoponestore.in')
        ? 'https://www.mahinsonestoponestore.in/reset-password'
        : `${window.location.origin}/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: redirectUrl,
      })

      if (error) {
        setForgotError(error.message)
      } else {
        setForgotMsg('Password reset link sent! Please check your inbox and spam folder.')
      }
    } catch {
      setForgotError('Failed to process request. Please try again.')
    }
    setForgotLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4EADE] p-4 sm:p-6 text-[#2B2B2B]">
      <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-8 shadow-xs border border-[#8A7968]/20">
        <div className="text-center mb-6 pb-4 border-b border-[#8A7968]/20">
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-black text-[#2B2B2B] tracking-tight">
              Mahin's One-Stop One-Store
            </h1>
          </Link>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-[#2B2B2B] text-center mb-1">Welcome Back</h2>
        <p className="text-xs text-[#8A7968] text-center mb-6">Log in to access your account & orders</p>

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

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#8A7968]/30 bg-white p-2.5 text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/60 focus:border-[#B76E79] focus:outline-hidden"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-[#2B2B2B]">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email)
                  setForgotMsg('')
                  setForgotError('')
                  setIsForgotModalOpen(true)
                }}
                className="text-[11px] font-bold text-[#B76E79] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#8A7968]/30 bg-white p-2.5 text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/60 focus:border-[#B76E79] focus:outline-hidden pr-12"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#B76E79] hover:bg-[#9E5B65] py-3 font-bold text-white transition disabled:opacity-50 text-xs sm:text-sm shadow-xs cursor-pointer btn-press"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#8A7968] border-t border-[#8A7968]/20 pt-4">
          Don't have an account?{' '}
          <Link href="/signup" className="font-bold text-[#B76E79] hover:underline">
            Sign Up
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-[#2B2B2B]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setIsForgotModalOpen(false)}>
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 w-full max-w-sm shadow-xl border border-[#8A7968]/20 relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b border-[#8A7968]/20 pb-2">
              <h3 className="text-sm sm:text-base font-bold text-[#2B2B2B]">Reset Password</h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-[#8A7968] hover:text-[#2B2B2B] text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8A7968] mb-4">
              Enter your registered account email. We will verify our records and send a secure reset link.
            </p>

            {forgotError && (
              <div className="mb-3 p-2.5 bg-red-100 text-red-700 rounded-xl text-xs font-semibold border border-red-200">
                {forgotError}
                {forgotError.includes('sign up') && (
                  <Link href="/signup" className="block mt-1 text-[#B76E79] underline font-bold">
                    Go to Sign Up Page →
                  </Link>
                )}
              </div>
            )}
            {forgotMsg && (
              <div className="mb-3 p-2.5 bg-green-100 text-green-800 rounded-xl text-xs font-semibold border border-green-200">
                {forgotMsg}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Account Email</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#8A7968]/30 bg-white p-2.5 text-xs sm:text-sm text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full rounded-xl bg-[#B76E79] hover:bg-[#9E5B65] py-2.5 font-bold text-white transition disabled:opacity-50 text-xs shadow-xs cursor-pointer btn-press"
              >
                {forgotLoading ? 'Checking Records...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}