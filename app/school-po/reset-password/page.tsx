// app/school-po/reset-password/page.tsx
'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '../../components/Logo'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!token) {
      setErrorMsg('Missing or invalid reset token. Please request a new link.')
      return
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/school-po/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_AND_UPDATE',
          token,
          newPassword,
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to reset password.')

      setSuccessMsg('Your password has been reset successfully! Redirecting to login...')
      setTimeout(() => {
        router.push('/school-po/auth')
      }, 2000)
    } catch (err: any) {
      setErrorMsg(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md bg-[#EFE3D3] rounded-3xl p-6 sm:p-8 border border-[#8A7968]/30 shadow-xl space-y-6">
      <div className="flex flex-col items-center text-center space-y-2.5 border-b border-[#8A7968]/20 pb-4">
        <Logo size={52} variant="icon" />
        <div>
          <h1 className="text-xl sm:text-2xl font-black">Set New Password</h1>
          <p className="text-xs text-[#8A7968] mt-1">
            Choose a new secure password for your School PO Portal account.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-green-100 border border-green-300 text-green-800 text-xs rounded-xl font-bold">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="block text-xs font-bold mb-1">New Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters..."
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
          <label className="block text-xs font-bold mb-1">Confirm New Password *</label>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password..."
            className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition cursor-pointer btn-press shadow-xs mt-2"
        >
          {loading ? 'Updating Password...' : 'Save New Password & Sign In 🔒'}
        </button>
      </form>

      <div className="text-center text-xs pt-2 border-t border-[#8A7968]/20">
        <Link href="/school-po/auth" className="text-[#B76E79] font-bold hover:underline">
          ← Return to School Login
        </Link>
      </div>
    </div>
  )
}

export default function SchoolPOResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F4EADE] flex flex-col items-center justify-center p-4 text-[#2B2B2B]">
      <Suspense fallback={<div className="font-bold text-xs text-[#8A7968]">Loading reset form...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}