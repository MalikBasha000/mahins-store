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
      // 1. Verify if user is registered in the database
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

      // 2. Dispatch reset email with explicit production redirect URL
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
    } catch (err: any) {
      setForgotError('Failed to process request. Please try again.')
    }
    setForgotLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center mb-6 pb-4 border-b">
          <h1 className="text-2xl font-black text-indigo-900">Mahin's One-Stop One-Store</h1>
        </div>

        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Welcome Back</h2>
        <p className="text-xs text-gray-500 text-center mb-6">Log in to access your account & orders</p>

        {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">{errorMsg}</div>}
        {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">{successMsg}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email)
                  setForgotMsg('')
                  setForgotError('')
                  setIsForgotModalOpen(true)
                }}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
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
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-indigo-600 focus:outline-none text-base"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50 text-sm shadow"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-600 border-t pt-4">
          Don't have an account?{' '}
          <Link href="/signup" className="font-semibold text-indigo-600 hover:underline">
            Sign Up
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-base font-bold text-gray-900">Reset Password</h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Enter your registered account email. We will check our records and send a secure reset link.
            </p>

            {forgotError && (
              <div className="mb-3 p-2.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">
                {forgotError}
                {forgotError.includes('Sign Up') && (
                  <Link href="/signup" className="block mt-1 text-indigo-700 underline font-bold">
                    Go to Sign Up Page →
                  </Link>
                )}
              </div>
            )}
            {forgotMsg && <div className="mb-3 p-2.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">{forgotMsg}</div>}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Account Email</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full rounded-lg bg-indigo-600 py-2.5 font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50 text-xs shadow"
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