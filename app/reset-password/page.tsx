// app/reset-password/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 1. Listen for Supabase recovery auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email)
        setErrorMsg('')
        setInitializing(false)
      }
    })

    // 2. Check if a valid recovery session already exists
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setUserEmail(session.user.email)
      } else if (error) {
        setErrorMsg('Auth session missing or link has expired. Please request a new password reset link.')
      }
      setInitializing(false)
    }

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)

    // Explicitly update the user password for the active recovery session
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      setSuccessMsg('Password updated successfully! Redirecting to login...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4EADE] p-4 sm:p-6 text-[#2B2B2B]">
      <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-[#EFE3D3] p-6 sm:p-8 shadow-xs border border-[#8A7968]/30">
        <div className="text-center mb-6 pb-4 border-b border-[#8A7968]/20">
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-black text-[#2B2B2B] tracking-tight">
              Mahin's One-Stop One-Store
            </h1>
          </Link>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-[#2B2B2B] text-center mb-1">Set New Password</h2>
        <p className="text-xs text-[#8A7968] text-center mb-4">Enter your new account password below</p>

        {/* Display Verified Registered User Email */}
        {userEmail && (
          <div className="mb-6 p-3 bg-[#EADBC8]/70 border border-[#8A7968]/30 rounded-xl text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B76E79] block">
              Registered Account
            </span>
            <span className="text-sm font-extrabold text-[#2B2B2B] font-mono">
              {userEmail}
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-xs font-semibold leading-relaxed border border-red-200">
            {errorMsg}
            {errorMsg.includes('expired') || errorMsg.includes('missing') ? (
              <Link href="/login" className="block mt-1.5 font-bold text-[#B76E79] underline">
                Request a new link on the Login page →
              </Link>
            ) : null}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-xl text-xs font-semibold border border-green-200">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-[#2B2B2B] mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                disabled={initializing}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden pr-12 disabled:bg-[#EADBC8]/50"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-[#8A7968] hover:text-[#2B2B2B] focus:outline-hidden text-base cursor-pointer"
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                disabled={initializing}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden pr-12 disabled:bg-[#EADBC8]/50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-[#8A7968] hover:text-[#2B2B2B] focus:outline-hidden text-base cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || initializing}
            className="w-full rounded-xl bg-[#B76E79] hover:bg-[#9E5B65] py-3 font-bold text-white transition disabled:opacity-50 text-xs sm:text-sm shadow-xs cursor-pointer btn-press"
          >
            {loading ? 'Updating Password...' : initializing ? 'Checking Session...' : 'Save New Password'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#8A7968] border-t border-[#8A7968]/20 pt-4">
          <Link href="/login" className="font-bold text-[#B76E79] hover:underline">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}