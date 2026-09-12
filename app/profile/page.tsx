// app/profile/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", 
  "Delhi", "Jammu and Kashmir", "Ladakh"
]

const ALL_COUNTRIES = [
  { name: "Afghanistan", code: "+93" },
  { name: "Albania", code: "+355" },
  { name: "Algeria", code: "+213" },
  { name: "Andorra", code: "+376" },
  { name: "Angola", code: "+244" },
  { name: "Antigua and Barbuda", code: "+1-268" },
  { name: "Argentina", code: "+54" },
  { name: "Armenia", code: "+374" },
  { name: "Australia", code: "+61" },
  { name: "Austria", code: "+43" },
  { name: "Azerbaijan", code: "+994" },
  { name: "Bahamas", code: "+1-242" },
  { name: "Bahrain", code: "+973" },
  { name: "Bangladesh", code: "+880" },
  { name: "Barbados", code: "+1-246" },
  { name: "Belarus", code: "+375" },
  { name: "Belgium", code: "+32" },
  { name: "Belize", code: "+501" },
  { name: "Benin", code: "+229" },
  { name: "Bhutan", code: "+975" },
  { name: "Bolivia", code: "+591" },
  { name: "Bosnia and Herzegovina", code: "+387" },
  { name: "Botswana", code: "+267" },
  { name: "Brazil", code: "+55" },
  { name: "Brunei", code: "+673" },
  { name: "Bulgaria", code: "+359" },
  { name: "Burkina Faso", code: "+226" },
  { name: "Burundi", code: "+257" },
  { name: "Cabo Verde", code: "+238" },
  { name: "Cambodia", code: "+855" },
  { name: "Cameroon", code: "+237" },
  { name: "Canada", code: "+1" },
  { name: "Central African Republic", code: "+236" },
  { name: "Chad", code: "+235" },
  { name: "Chile", code: "+56" },
  { name: "China", code: "+86" },
  { name: "Colombia", code: "+57" },
  { name: "Comoros", code: "+269" },
  { name: "Congo", code: "+242" },
  { name: "Costa Rica", code: "+506" },
  { name: "Croatia", code: "+385" },
  { name: "Cuba", code: "+53" },
  { name: "Cyprus", code: "+357" },
  { name: "Czech Republic", code: "+420" },
  { name: "Denmark", code: "+45" },
  { name: "Djibouti", code: "+253" },
  { name: "Dominica", code: "+1-767" },
  { name: "Dominican Republic", code: "+1-809" },
  { name: "Ecuador", code: "+593" },
  { name: "Egypt", code: "+20" },
  { name: "El Salvador", code: "+503" },
  { name: "Equatorial Guinea", code: "+240" },
  { name: "Eritrea", code: "+291" },
  { name: "Estonia", code: "+372" },
  { name: "Eswatini", code: "+268" },
  { name: "Ethiopia", code: "+251" },
  { name: "Fiji", code: "+679" },
  { name: "Finland", code: "+358" },
  { name: "France", code: "+33" },
  { name: "Gabon", code: "+241" },
  { name: "Gambia", code: "+220" },
  { name: "Georgia", code: "+995" },
  { name: "Germany", code: "+49" },
  { name: "Ghana", code: "+233" },
  { name: "Greece", code: "+30" },
  { name: "Grenada", code: "+1-473" },
  { name: "Guatemala", code: "+502" },
  { name: "Guinea", code: "+224" },
  { name: "Guinea-Bissau", code: "+245" },
  { name: "Guyana", code: "+592" },
  { name: "Haiti", code: "+509" },
  { name: "Honduras", code: "+504" },
  { name: "Hungary", code: "+36" },
  { name: "Iceland", code: "+354" },
  { name: "India", code: "+91" },
  { name: "Indonesia", code: "+62" },
  { name: "Iran", code: "+98" },
  { name: "Iraq", code: "+964" },
  { name: "Ireland", code: "+353" },
  { name: "Israel", code: "+972" },
  { name: "Italy", code: "+39" },
  { name: "Jamaica", code: "+1-876" },
  { name: "Japan", code: "+81" },
  { name: "Jordan", code: "+962" },
  { name: "Kazakhstan", code: "+7" },
  { name: "Kenya", code: "+254" },
  { name: "Kuwait", code: "+965" },
  { name: "Malaysia", code: "+60" },
  { name: "Nepal", code: "+977" },
  { name: "Netherlands", code: "+31" },
  { name: "New Zealand", code: "+64" },
  { name: "Pakistan", code: "+92" },
  { name: "Russia", code: "+7" },
  { name: "Saudi Arabia", code: "+966" },
  { name: "Singapore", code: "+65" },
  { name: "South Africa", code: "+27" },
  { name: "South Korea", code: "+82" },
  { name: "Spain", code: "+34" },
  { name: "Sri Lanka", code: "+94" },
  { name: "Sweden", code: "+46" },
  { name: "Switzerland", code: "+41" },
  { name: "Thailand", code: "+66" },
  { name: "Turkey", code: "+90" },
  { name: "UAE", code: "+971" },
  { name: "UK", code: "+44" },
  { name: "USA", code: "+1" },
  { name: "Vietnam", code: "+84" }
]

export default function ProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const alertRef = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')
  const [countryCode, setCountryCode] = useState<string>('+91')
  const [phone, setPhone] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [houseNo, setHouseNo] = useState<string>('')
  const [plotNo, setPlotNo] = useState<string>('')
  const [street, setStreet] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [district, setDistrict] = useState<string>('')
  const [state, setState] = useState<string>('')
  const [pincode, setPincode] = useState<string>('')

  // Coupons state
  const [assignedCoupons, setAssignedCoupons] = useState<any[]>([])
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null)

  useEffect(() => {
    const getProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const userEmail = user.email || ''
        setEmail(userEmail)
        setFullName(user.user_metadata?.full_name || '')

        const { data } = await supabase
          .from('customer_addresses')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (data) {
          setCountryCode(data.country_code || '+91')
          setPhone(data.phone || '')
          setAvatarUrl(data.avatar_url || '')
          setHouseNo(data.house_no || '')
          setPlotNo(data.plot_no || '')
          setStreet(data.street || '')
          setCity(data.city || '')
          setDistrict(data.district || '')
          setState(data.state || '')
          setPincode(data.pincode || '')
        }

        // Fetch coupons available or targeted for this customer
        try {
          const { data: couponsData } = await supabase
            .from('coupons')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })

          if (couponsData) {
            const normalizedEmail = userEmail.trim().toLowerCase()
            const eligible = couponsData.filter((c: any) => {
              if (!c.target_customer_email) return true
              return c.target_customer_email.trim().toLowerCase() === normalizedEmail
            })
            setAssignedCoupons(eligible)
          }
        } catch (couponErr) {
          console.error('Error fetching customer coupons:', couponErr)
        }
      }
      setLoading(false)
    }
    getProfileData()
  }, [supabase])

  useEffect(() => {
    if ((message || errorMsg) && alertRef.current) {
      alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [message, errorMsg])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 2MB. Please choose a smaller file.')
      return
    }

    setUploading(true)
    setErrorMsg('')
    const fileName = `${Date.now()}-${file.name}`
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file)

    if (uploadError) {
      setErrorMsg('Error uploading image. Please try again.')
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setAvatarUrl(data.publicUrl)
    }
    setUploading(false)
  }

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value
    setPincode(pin)
    if (pin.length === 6 && /^\d+$/.test(pin)) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
        const data = await res.json()
        if (data?.[0]?.Status === "Success") {
          const p = data[0].PostOffice[0]
          setState(p.State || '')
          setDistrict(p.District || '')
          setCity(p.Name || '')
        }
      } catch (err) {
        console.error("Pincode fetch error", err)
      }
    }
  }

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCoupon(code)
    setTimeout(() => setCopiedCoupon(null), 2500)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setErrorMsg('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMsg('No user logged in.')
      setSaving(false)
      return
    }

    // Security: strictly use verified session email
    const verifiedEmail = user.email || email

    const { error } = await supabase.from('customer_addresses').upsert({
      user_id: user.id, 
      email: verifiedEmail,
      full_name: fullName, 
      country_code: countryCode,
      phone, 
      avatar_url: avatarUrl, 
      house_no: houseNo, 
      plot_no: plotNo,
      street, 
      city, 
      district, 
      state, 
      pincode, 
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

    if (error) setErrorMsg(error.message)
    else setMessage('Profile updated successfully!')
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-center text-xs sm:text-sm text-[#8A7968] font-bold">Loading profile...</div>

  return (
    <div className="min-h-screen bg-[#F4EADE] pb-24 sm:pb-16 w-full overflow-x-hidden text-[#2B2B2B]">
      {/* Header */}
      <header className="bg-[#EFE3D3] border-b border-[#8A7968]/30 px-4 sm:px-8 py-3.5 sm:py-5 shadow-xs mb-6 sm:mb-8 w-full">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2">
          <Link href="/" className="hover:opacity-90 transition min-w-0">
            <h1 className="text-base sm:text-2xl font-black text-[#2B2B2B] tracking-tight truncate">
              Mahin's One-Stop One-Store
            </h1>
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/orders" className="text-xs font-bold text-[#2B2B2B] hover:text-[#B76E79]">
              My Orders
            </Link>
            <span className="text-[#8A7968]/40">•</span>
            <Link href="/" className="text-xs font-bold text-[#B76E79] hover:underline whitespace-nowrap">
              ← Back to Store
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-3 sm:px-6 w-full space-y-6" ref={alertRef}>
        {/* Account Info Summary Card */}
        <div className="bg-[#EFE3D3] p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs border border-[#8A7968]/30 w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="h-12 w-12 rounded-full overflow-hidden border border-[#8A7968]/30 bg-[#F4EADE] flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl text-[#8A7968]">👤</span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7968] block">Logged In Account</span>
              <div className="text-sm sm:text-base font-black text-[#2B2B2B]">{fullName || 'Valued Customer'}</div>
              <div className="text-xs text-[#8A7968] font-mono">{email}</div>
            </div>
          </div>
          <Link
            href="/orders"
            className="bg-[#EADBC8] hover:bg-[#8A7968]/20 border border-[#8A7968]/30 text-[#2B2B2B] text-xs font-bold px-4 py-2 rounded-xl transition shadow-2xs whitespace-nowrap"
          >
            Track & View Orders 📦
          </Link>
        </div>

        {/* Exclusive Promo Codes Section */}
        <div className="bg-[#EFE3D3] p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs border border-[#8A7968]/30 w-full">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#2B2B2B] flex items-center gap-1.5">
                🏷️ Exclusive Promo Codes & Discounts
              </h3>
              <p className="text-[11px] text-[#8A7968] mt-0.5">Special discounts linked to your account and checkout</p>
            </div>
            <span className="text-[10px] font-extrabold bg-[#B76E79]/15 text-[#B76E79] border border-[#B76E79]/30 px-2.5 py-0.5 rounded-full">
              {assignedCoupons.length} Active
            </span>
          </div>

          {assignedCoupons.length === 0 ? (
            <div className="bg-[#F4EADE] p-4 rounded-xl border border-[#8A7968]/20 text-center text-xs text-[#8A7968] italic">
              No special promo codes currently assigned. Stay tuned for promotional offers!
            </div>
          ) : (
            <div className="space-y-2.5">
              {assignedCoupons.map((c) => {
                const isTargeted = Boolean(c.target_customer_email)
                const isCopied = copiedCoupon === c.code

                return (
                  <div
                    key={c.id}
                    className="bg-[#F4EADE] p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#8A7968]/30 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-xs sm:text-sm text-[#B76E79] tracking-wider">
                          {c.code}
                        </span>
                        {isTargeted ? (
                          <span className="bg-[#B76E79] text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                            Exclusive for you 🔒
                          </span>
                        ) : (
                          <span className="bg-[#EADBC8] text-[#2B2B2B] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border border-[#8A7968]/30">
                            Store Promo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#2B2B2B] font-semibold mt-0.5">
                        {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT OFF`}
                        {c.min_order_amount > 0 && (
                          <span className="text-[#8A7968] font-normal ml-1">
                            (Min order: ₹{c.min_order_amount})
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCoupon(c.code)}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
                        isCopied
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] border-[#8A7968]/40'
                      }`}
                    >
                      {isCopied ? '✓ Copied' : 'Copy Code 📋'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Profile & Default Address Form */}
        <div className="bg-[#EFE3D3] p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xs border border-[#8A7968]/30 w-full">
          <h2 className="text-xl sm:text-2xl font-bold text-[#2B2B2B] mb-5 sm:mb-6">Delivery Address & Contact Details</h2>
          
          {message && <div className="mb-5 p-3.5 sm:p-4 bg-green-100 text-green-800 rounded-xl text-xs sm:text-sm font-medium border border-green-300">{message}</div>}
          {errorMsg && <div className="mb-5 p-3.5 sm:p-4 bg-red-100 text-red-700 rounded-xl text-xs sm:text-sm font-medium border border-red-300">{errorMsg}</div>}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border-b border-[#8A7968]/20 pb-5 mb-5 text-center sm:text-left">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden border-2 border-[#B76E79] bg-[#F4EADE] flex items-center justify-center shadow-inner shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-[#8A7968]">👤</span>
                )}
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-xs sm:text-sm font-medium text-[#2B2B2B] mb-1">Profile Picture (Max 2MB)</label>
                <input 
                  type="file" 
                  onChange={handleFileUpload} 
                  disabled={uploading} 
                  className="w-full text-xs sm:text-sm text-[#8A7968] file:mr-3 file:py-1.5 file:px-3 sm:file:py-2 sm:file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#B76E79]/15 file:text-[#B76E79] hover:file:bg-[#B76E79]/25 cursor-pointer" 
                />
                {uploading && <span className="text-xs text-[#B76E79] mt-1 block font-semibold">Uploading image...</span>}
              </div>
            </div>

            {/* Permanent Verified Login Email (Locked) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#2B2B2B] mb-1">
                Account Email <span className="text-[10px] text-[#B76E79] font-bold ml-1">(Locked & Non-Editable 🔒)</span>
              </label>
              <input 
                type="email" 
                value={email} 
                readOnly
                disabled
                className="w-full border border-[#8A7968]/40 bg-[#EADBC8]/70 p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] font-mono font-bold cursor-not-allowed select-none min-w-0" 
              />
              <p className="text-[10px] text-[#8A7968] mt-1">Your verified login email is permanent and secured to protect account orders.</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#2B2B2B] mb-1">Full Name</label>
              <input 
                type="text" 
                required 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="Full Name" 
                className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden min-w-0" 
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#2B2B2B] mb-1">Mobile Number (Select Country Code)</label>
              <div className="flex gap-2 w-full">
                <select 
                  value={countryCode} 
                  onChange={(e) => setCountryCode(e.target.value)} 
                  className="w-32 sm:w-48 border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden font-medium shrink-0"
                >
                  {ALL_COUNTRIES.map(c => (
                    <option key={c.code + c.name} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                <input 
                  type="tel" 
                  required 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="10-digit phone number" 
                  className="flex-1 border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden min-w-0" 
                />
              </div>
              <p className="text-[11px] text-[#8A7968] mt-1">Tip: Click the dropdown and type letters to jump to any country.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#2B2B2B] mb-1">House No.</label>
                <input 
                  type="text" 
                  value={houseNo} 
                  onChange={(e) => setHouseNo(e.target.value)} 
                  placeholder="House No" 
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden min-w-0" 
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#2B2B2B] mb-1">Plot No.</label>
                <input 
                  type="text" 
                  value={plotNo} 
                  onChange={(e) => setPlotNo(e.target.value)} 
                  placeholder="Plot No" 
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden min-w-0" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#2B2B2B] mb-1">Street / Line</label>
              <input 
                type="text" 
                required 
                value={street} 
                onChange={(e) => setStreet(e.target.value)} 
                placeholder="Street / Line" 
                className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden min-w-0" 
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#2B2B2B] mb-1">Pincode (Auto-fills location)</label>
              <input 
                type="text" 
                required 
                maxLength={6} 
                value={pincode} 
                onChange={handlePincodeChange} 
                placeholder="Enter 6-digit Pincode" 
                className="w-full border border-[#8A7968]/50 bg-[#EADBC8]/70 p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden min-w-0" 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#2B2B2B] mb-1">City / Town</label>
                <input 
                  type="text" 
                  required 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  placeholder="City" 
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden min-w-0" 
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#2B2B2B] mb-1">District</label>
                <input 
                  type="text" 
                  required 
                  value={district} 
                  onChange={(e) => setDistrict(e.target.value)} 
                  placeholder="District" 
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden min-w-0" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#2B2B2B] mb-1">State</label>
              <select 
                required 
                value={state} 
                onChange={(e) => setState(e.target.value)} 
                className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden min-w-0"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={saving} 
              className="w-full bg-[#B76E79] hover:bg-[#9E5B65] text-white font-extrabold p-3 rounded-xl transition disabled:opacity-50 mt-6 shadow-xs cursor-pointer btn-press text-xs sm:text-sm"
            >
              {saving ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}