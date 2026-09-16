// app/school-po/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSchoolPOCart } from '../../context/SchoolPOCartContext'
import { createClient } from '../../../lib/supabase/client'
import Logo from '../../components/Logo'

export default function SchoolProfilePage() {
  const { schoolUser, setSchoolUser } = useSchoolPOCart()
  const router = useRouter()
  const supabase = createClient()

  const [schoolName, setSchoolName] = useState('')
  const [educatorName, setEducatorName] = useState('')
  const [phone, setPhone] = useState('')
  const [udiseCode, setUdiseCode] = useState('')
  const [atlCode, setAtlCode] = useState('')
  const [address, setAddress] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!schoolUser) {
      router.push('/school-po/auth')
      return
    }

    setSchoolName(schoolUser.school_name || '')
    setEducatorName(schoolUser.educator_name || '')
    setPhone(schoolUser.phone || '')
    setUdiseCode(schoolUser.udise_code || '')
    setAtlCode(schoolUser.atl_code || '')
    setAddress(schoolUser.address || '')
  }, [schoolUser, router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolUser) return

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const updates = {
        school_name: schoolName.trim(),
        educator_name: educatorName.trim(),
        phone: phone.trim(),
        udise_code: udiseCode.trim().toUpperCase(),
        atl_code: atlCode.trim().toUpperCase() || null,
        address: address.trim(),
      }

      const { data, error } = await supabase
        .from('school_accounts')
        .update(updates)
        .eq('id', schoolUser.id)
        .select()
        .single()

      if (error) throw error

      setSchoolUser(data)
      setSuccessMsg('Institutional profile updated successfully!')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.')
    }
    setLoading(false)
  }

  if (!schoolUser) return null

  return (
    <div className="min-h-screen bg-[#F4EADE] py-8 px-4 sm:px-6 lg:px-8 text-[#2B2B2B]">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-[#EFE3D3] rounded-3xl p-6 sm:p-8 border border-[#8A7968]/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size={56} variant="icon" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black">{schoolUser.school_name}</h1>
                <span className="text-[10px] bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 rounded-full font-bold">
                  ✓ Verified Account
                </span>
              </div>
              <p className="text-xs text-[#8A7968] font-semibold mt-0.5">
                UDISE: {schoolUser.udise_code} {schoolUser.atl_code ? `| ATL: ${schoolUser.atl_code}` : ''}
              </p>
            </div>
          </div>
          <Link
            href="/school-po"
            className="rounded-xl bg-[#F4EADE] px-4 py-2 text-xs font-bold text-[#2B2B2B] hover:bg-[#EADBC8] transition border border-[#8A7968]/30 shrink-0"
          >
            ← Back to Catalog
          </Link>
        </div>

        {/* Edit Form Card */}
        <div className="bg-[#EFE3D3] rounded-3xl p-6 sm:p-8 border border-[#8A7968]/30 shadow-xl space-y-6">
          <div className="border-b border-[#8A7968]/20 pb-3">
            <h2 className="text-lg font-black">Institutional Profile Settings</h2>
            <p className="text-xs text-[#8A7968]">
              Update school records, lab coordinator details, and primary delivery destination.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-100 border border-green-300 text-green-800 text-xs rounded-xl font-bold">
              ✓ {successMsg}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* School / Institution Name */}
              <div>
                <label className="block text-xs font-bold mb-1">School / Institution Name *</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>

              {/* Educator / Lab Incharge */}
              <div>
                <label className="block text-xs font-bold mb-1">Educator / Lab Incharge *</label>
                <input
                  type="text"
                  required
                  value={educatorName}
                  onChange={(e) => setEducatorName(e.target.value)}
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>

              {/* Official School Email (LOCKED / READ ONLY) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold">Official School Email</label>
                  <span className="text-[10px] text-[#8A7968] font-bold">🔒 Locked (Primary Key)</span>
                </div>
                <input
                  type="email"
                  disabled
                  value={schoolUser.email}
                  className="w-full border border-[#8A7968]/20 bg-[#EADBC8]/60 p-2.5 rounded-xl text-xs text-[#666] cursor-not-allowed select-none"
                  title="Official school email cannot be altered as it is tied to authentication and order histories."
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold mb-1">Contact Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>

              {/* School UDISE Code */}
              <div>
                <label className="block text-xs font-bold mb-1">School UDISE Code *</label>
                <input
                  type="text"
                  required
                  value={udiseCode}
                  onChange={(e) => setUdiseCode(e.target.value)}
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs font-mono uppercase focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>

              {/* ATL Code (Optional) */}
              <div>
                <label className="block text-xs font-bold mb-1">ATL Lab Code (Optional)</label>
                <input
                  type="text"
                  value={atlCode}
                  onChange={(e) => setAtlCode(e.target.value)}
                  placeholder="e.g. ATL-098231"
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs font-mono uppercase focus:border-[#B76E79] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Delivery Campus Address */}
            <div>
              <label className="block text-xs font-bold mb-1">School Campus Delivery Address *</label>
              <textarea
                rows={3}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Complete street address, landmark, district, state & pincode..."
                className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs focus:border-[#B76E79] focus:outline-hidden leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <Link
                href="/school-po"
                className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl border border-[#8A7968]/30 bg-[#F4EADE] hover:bg-[#EADBC8] text-xs font-bold transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold py-2.5 px-6 rounded-xl text-xs transition cursor-pointer shadow-xs btn-press"
              >
                {loading ? 'Saving Changes...' : 'Save Profile Changes 💾'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}