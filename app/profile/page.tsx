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

  useEffect(() => {
    const getProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
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
      }
      setLoading(false)
    }
    getProfileData()
  }, [])

  useEffect(() => {
    if ((message || errorMsg) && alertRef.current) {
      alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [message, errorMsg])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 2MB size limit check
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

    const { error } = await supabase.from('customer_addresses').upsert({
      user_id: user.id, full_name: fullName, country_code: countryCode,
      phone, avatar_url: avatarUrl, house_no: houseNo, plot_no: plotNo,
      street, city, district, state, pincode, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

    if (error) setErrorMsg(error.message)
    else setMessage('Profile updated successfully!')
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-center text-gray-600">Loading profile...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white px-8 py-6 shadow-sm mb-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-2xl font-extrabold text-indigo-900">Mahin's One-Stop One-Store</h1>
          <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline">← Back to Store</Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl bg-white p-8 rounded-2xl shadow-md" ref={alertRef}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Profile & Address</h2>
        
        {message && <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg font-medium border border-green-300">{message}</div>}
        {errorMsg && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg font-medium border border-red-300">{errorMsg}</div>}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-6 border-b pb-6 mb-6">
            <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-indigo-500 bg-gray-100 flex items-center justify-center shadow-inner">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-gray-400">👤</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture (Max 2MB)</label>
              <input type="file" onChange={handleFileUpload} disabled={uploading} className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
              {uploading && <span className="text-xs text-indigo-600 mt-1 block">Uploading image...</span>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 focus:border-indigo-500 focus:outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number (Select Country Code)</label>
            <div className="flex gap-2">
              <select 
                value={countryCode} 
                onChange={(e) => setCountryCode(e.target.value)} 
                className="w-72 border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 bg-white focus:border-indigo-500 focus:outline-none font-medium"
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
                className="flex-1 border border-gray-300 p-2.5 rounded-lg text-gray-900 focus:border-indigo-500 focus:outline-none" 
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Tip: Click the dropdown and type letters on your keyboard to instantly jump to any country.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">House No.</label>
              <input type="text" value={houseNo} onChange={(e) => setHouseNo(e.target.value)} placeholder="House No" className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plot No.</label>
              <input type="text" value={plotNo} onChange={(e) => setPlotNo(e.target.value)} placeholder="Plot No" className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street / Line</label>
            <input type="text" required value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street / Line" className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 focus:border-indigo-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode (Auto-fills location)</label>
            <input type="text" required maxLength={6} value={pincode} onChange={handlePincodeChange} placeholder="Enter 6-digit Pincode" className="w-full border border-indigo-300 bg-indigo-50 p-2.5 rounded-lg text-indigo-900 focus:border-indigo-500 focus:outline-none" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City / Town</label>
              <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input type="text" required value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select required value={state} onChange={(e) => setState(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-900 bg-white focus:border-indigo-500 focus:outline-none">
              <option value="">Select State</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-3 rounded-lg transition disabled:opacity-50 mt-6 shadow-md">
            {saving ? 'Saving...' : 'Save Profile Details'}
          </button>
        </form>
      </div>
    </div>
  )
}