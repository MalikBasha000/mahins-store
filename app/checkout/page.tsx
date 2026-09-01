// app/checkout/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '../context/CartContext'
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

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const { cart, totalPrice, clearCart } = useCart()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [trackingId, setTrackingId] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Payment Gateway Settings from Admin Dashboard
  const [paymentSettings, setPaymentSettings] = useState({
    is_razorpay_enabled: true,
    is_upi_enabled: true,
    is_cod_enabled: true,
    cod_message: 'Payments not accepting currently'
  })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [houseNo, setHouseNo] = useState('')
  const [plotNo, setPlotNo] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [stateName, setStateName] = useState('Telangana')
  const [pincode, setPincode] = useState('')
  
  const [paymentMethod, setPaymentMethod] = useState('')
  const [upiUtr, setUpiUtr] = useState('')

  useEffect(() => {
    setMounted(true)

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    const fetchCheckoutConfig = async () => {
      setDataLoading(true)
      try {
        const settingsRes = await fetch('/api/settings')
        const settingsData = await settingsRes.json()
        if (settingsData.success && settingsData.settings) {
          const cfg = settingsData.settings
          setPaymentSettings(cfg)
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          setIsLoggedIn(true)
          setEmail(user.email || '')
          setName(user.user_metadata?.full_name || '')

          const { data, error } = await supabase
            .from('customer_addresses')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()

          if (data && !error) {
            if (data.full_name) setName(data.full_name)
            if (data.phone) setPhone(data.phone)
            if (data.country_code) setCountryCode(data.country_code)
            if (data.house_no) setHouseNo(data.house_no)
            if (data.plot_no) setPlotNo(data.plot_no)
            if (data.street) setStreet(data.street)
            if (data.city) setCity(data.city)
            if (data.district) setDistrict(data.district)
            if (data.state) setStateName(data.state)
            if (data.pincode) setPincode(data.pincode)
          }
        } else {
          setIsLoggedIn(false)
        }
      } catch (err) {
        console.error('Error loading checkout configuration:', err)
      } finally {
        setDataLoading(false)
      }
    }

    fetchCheckoutConfig()
  }, [supabase])

  // Determine active payment method availability
  useEffect(() => {
    const isRazorpayActive = paymentSettings.is_razorpay_enabled
    const isUpiActive = paymentSettings.is_upi_enabled
    // COD requires login
    const isCodActive = isLoggedIn && paymentSettings.is_cod_enabled

    if (isRazorpayActive) setPaymentMethod('Online Gateway (Razorpay)')
    else if (isUpiActive) setPaymentMethod('Direct UPI Transfer (Scan & Pay)')
    else if (isCodActive) setPaymentMethod('Cash on Delivery (COD)')
    else setPaymentMethod('')
  }, [paymentSettings, isLoggedIn])

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value
    setPincode(pin)
    if (pin.length === 6 && /^\d+$/.test(pin)) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
        const data = await res.json()
        if (data?.[0]?.Status === 'Success') {
          const p = data[0].PostOffice[0]
          setStateName(p.State || '')
          setDistrict(p.District || '')
          setCity(p.Name || '')
        }
      } catch (err) {
        console.error('Pincode fetch error:', err)
      }
    }
  }

  const generateTrackingId = () => {
    let result = ''
    for (let i = 0; i < 16; i++) {
      result += Math.floor(Math.random() * 10).toString()
    }
    return result
  }

  const processOrderSubmission = async (paymentRefId?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const currentUserId = user?.id || userId || null
    const userEmail = email.trim() || user?.email || ''

    const newTrackingId = generateTrackingId()
    const housePlotPart = [
      houseNo ? `House No: ${houseNo}` : '',
      plotNo ? `Plot No: ${plotNo}` : '',
    ].filter(Boolean).join(', ')

    const formattedPhone = `${countryCode} ${phone}`.trim()
    const formattedAddress = `${housePlotPart}, Street: ${street}, City: ${city}, District: ${district}, State: ${stateName}, Pincode: ${pincode}, Phone: ${formattedPhone}`

    const addressSnapshotObj = {
      full_name: name,
      email: userEmail,
      customer_email: userEmail,
      phone: formattedPhone,
      house_no: houseNo,
      plot_no: plotNo,
      street: street,
      city: city,
      district: district,
      state: stateName,
      pincode: pincode,
      formatted: formattedAddress
    }

    // Save address if logged in
    if (currentUserId) {
      await supabase.from('customer_addresses').upsert({
        user_id: currentUserId,
        full_name: name,
        email: userEmail,
        phone: formattedPhone,
        country_code: countryCode,
        house_no: houseNo,
        plot_no: plotNo,
        street: street,
        city: city,
        district: district,
        state: stateName,
        pincode: pincode,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
    }

    let finalPaymentMethod = paymentMethod
    if (paymentRefId) {
      finalPaymentMethod = `${paymentMethod} (Paid - ID: ${paymentRefId})`
    } else if (paymentMethod === 'Direct UPI Transfer (Scan & Pay)') {
      const cleanUtr = upiUtr.trim() ? upiUtr.trim() : 'Not Provided / Check Bank'
      finalPaymentMethod = `Direct UPI Transfer (UTR: ${cleanUtr})`
    }

    const initialOrderStatus = paymentMethod === 'Direct UPI Transfer (Scan & Pay)' ? 'PENDING VERIFICATION' : 'Pending'

    const orderPayload: any = {
      user_id: currentUserId, // Can be null for guest checkouts
      tracking_id: newTrackingId,
      customer_name: name,
      customer_phone: formattedPhone,
      shipping_address: formattedAddress,
      shipping_address_snapshot: addressSnapshotObj,
      payment_method: finalPaymentMethod,
      total_amount: totalPrice,
      final_payable_amount: totalPrice,
      status: initialOrderStatus,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity) || 1,
        image_url: item.image_url || '',
      })),
    }

    const { error: orderError } = await supabase.from('orders').insert([orderPayload])
    if (orderError) throw new Error(orderError.message)

    for (const item of cart) {
      const qty = Number(item.quantity) || 1
      const { data: currentProduct } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.id)
        .single()

      if (currentProduct) {
        await supabase
          .from('products')
          .update({ stock: Math.max(0, currentProduct.stock - qty) })
          .eq('id', item.id)
      }
    }

    try {
      await fetch('/api/send-order-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ORDER_PLACED',
          customerEmail: userEmail,
          orderDetails: {
            tracking_id: newTrackingId,
            customer_name: name,
            customer_email: userEmail,
            phone: formattedPhone,
            shipping_address: formattedAddress,
            payment_method: finalPaymentMethod,
            total_amount: totalPrice,
            items: cart.map((item) => ({
              id: item.id,
              name: item.name,
              price: Number(item.price),
              quantity: Number(item.quantity) || 1,
              image_url: item.image_url || '',
            })),
          },
        }),
      })
    } catch (err) {
      console.error('Email API Error:', err)
    }

    clearCart()
    setTrackingId(newTrackingId)
    setOrderSuccess(true)
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    // If user selects COD while not logged in, block them
    if (paymentMethod === 'Cash on Delivery (COD)' && !isLoggedIn) {
      setErrorMsg('Please sign in or create an account to use Cash on Delivery (COD).')
      return
    }

    if (cart.length === 0) {
      setErrorMsg('Your cart is empty. Please add items before checking out.')
      return
    }

    if (!email || !email.trim()) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    if (!phone || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid mobile number.')
      return
    }

    if (!paymentMethod) {
      setErrorMsg('No payment method is currently available or selected.')
      return
    }

    setLoading(true)

    try {
      if (paymentMethod === 'Direct UPI Transfer (Scan & Pay)' || paymentMethod === 'Cash on Delivery (COD)') {
        await processOrderSubmission()
      } else {
        const res = await fetch('/api/razorpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: totalPrice }),
        })
        const data = await res.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to initiate payment gateway.')
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.order.amount,
          currency: "INR",
          name: "Mahin's One-Stop One-Store",
          description: "Purchase of Electronics & Robotics Components",
          order_id: data.order.id,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              })
              const verifyData = await verifyRes.json()

              if (!verifyData.success) {
                throw new Error('Payment signature verification failed.')
              }

              await processOrderSubmission(response.razorpay_payment_id)
            } catch (innerErr: any) {
              setErrorMsg(innerErr.message || 'Payment verification or order placement failed.')
              setLoading(false)
            }
          },
          prefill: {
            name: name,
            email: email,
            contact: phone,
          },
          theme: {
            color: "#4f46e5",
          },
          modal: {
            ondismiss: function() {
              setLoading(false)
            }
          }
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
        return 
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while placing your order.')
      setLoading(false)
    }
  }

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading checkout...</div>
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg w-full text-center border border-gray-100">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-sm text-gray-600 mb-6">
            Thank you for shopping with Mahin's One-Stop One-Store.
          </p>

          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 mb-6">
            <span className="text-[11px] font-extrabold text-indigo-700 tracking-wider uppercase block mb-1">
              Your 16-Digit Tracking ID
            </span>
            <div className="text-xl font-mono font-extrabold text-indigo-950 tracking-wider">
              {trackingId}
            </div>
            <p className="text-xs text-indigo-800/80 mt-2">
              Inventory updated and confirmation emails dispatched.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="w-1/2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-sm transition"
            >
              Return to Store
            </Link>
            <Link
              href={`/track?id=${trackingId}`}
              className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-1.5"
            >
              Track Order 📦
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isRazorpayActive = paymentSettings.is_razorpay_enabled
  const isUpiActive = paymentSettings.is_upi_enabled
  const isCodActive = isLoggedIn && paymentSettings.is_cod_enabled
  const allDisabled = !isRazorpayActive && !isUpiActive && !isCodActive

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white border-b border-gray-200 px-6 py-4 mb-8 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-indigo-950">
            Mahin's One-Stop One-Store
          </h1>
          <Link href="/cart" className="text-xs font-bold text-indigo-600 hover:underline">
            ← Back to Cart
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-indigo-950">Secure Checkout</h2>
          <p className="text-xs text-gray-500 mt-1">Review your items and complete shipping details</p>
        </div>

        {/* Optional Sign In Banner for Guests */}
        {!isLoggedIn && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-wrap justify-between items-center gap-4">
            <div className="text-xs font-bold text-indigo-950">
              💡 Checking out as guest? You can place prepaid orders instantly. <Link href="/login" className="text-indigo-600 underline">Sign In</Link> or <Link href="/signup" className="text-indigo-600 underline">Create an Account</Link> to unlock Cash on Delivery (COD).
            </div>
            <div className="flex gap-2">
              <Link href="/login" className="bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition">
                Sign In 🔒
              </Link>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl text-xs font-semibold border border-red-200">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2">
                1. Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 bg-white focus:border-indigo-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 bg-white focus:border-indigo-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 border border-gray-300 bg-gray-50 rounded-lg text-sm font-semibold text-gray-700">
                    {countryCode}
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="flex-1 border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 bg-white focus:border-indigo-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2 pt-4">
                2. Shipping Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">House No. *</label>
                  <input
                    type="text"
                    required
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    placeholder="House No."
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 bg-white focus:border-indigo-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Plot No.</label>
                  <input
                    type="text"
                    value={plotNo}
                    onChange={(e) => setPlotNo(e.target.value)}
                    placeholder="Plot No."
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 bg-white focus:border-indigo-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Street / Line *</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street / Line"
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 bg-white focus:border-indigo-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pincode (Auto-fills location) *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={handlePincodeChange}
                  placeholder="6-digit Pincode"
                  className="w-full border border-indigo-300 bg-indigo-50/50 p-2.5 rounded-lg text-sm text-indigo-950 font-bold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full border border-gray-300 p-2 rounded-lg text-sm text-gray-900 bg-white focus:border-indigo-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="District"
                    className="w-full border border-gray-300 p-2 rounded-lg text-sm text-gray-900 bg-white focus:border-indigo-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">State *</label>
                <select
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 bg-white focus:border-indigo-500 focus:outline-none font-medium"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2 pt-4">
                3. Payment Method
              </h3>

              {allDisabled ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200 text-center">
                  {paymentSettings.cod_message || 'Payments not accepting currently'}
                </div>
              ) : (
                <div className="space-y-2">
                  {isRazorpayActive && (
                    <label
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                        paymentMethod === 'Online Gateway (Razorpay)' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Online Gateway (Razorpay)"
                        checked={paymentMethod === 'Online Gateway (Razorpay)'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-indigo-600"
                      />
                      <span className="text-xs font-bold text-gray-800">Online Gateway (Razorpay)</span>
                    </label>
                  )}

                  {isUpiActive && (
                    <label
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                        paymentMethod === 'Direct UPI Transfer (Scan & Pay)' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Direct UPI Transfer (Scan & Pay)"
                        checked={paymentMethod === 'Direct UPI Transfer (Scan & Pay)'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-indigo-600"
                      />
                      <span className="text-xs font-bold text-gray-800">Direct UPI Transfer (Scan & Pay)</span>
                    </label>
                  )}

                  {isCodActive && (
                    <label
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                        paymentMethod === 'Cash on Delivery (COD)' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Cash on Delivery (COD)"
                        checked={paymentMethod === 'Cash on Delivery (COD)'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-indigo-600"
                      />
                      <span className="text-xs font-bold text-gray-800">Cash on Delivery (COD)</span>
                    </label>
                  )}

                  {!isLoggedIn && paymentSettings.is_cod_enabled && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex justify-between items-center">
                      <span>🔒 Cash on Delivery is locked for guest checkouts.</span>
                      <Link href="/login" className="font-bold underline text-indigo-600">Sign in to unlock COD</Link>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'Direct UPI Transfer (Scan & Pay)' && isUpiActive && (
                <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-200 space-y-4">
                  <div className="text-center">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide block mb-1">Scan QR Code with any UPI App</span>
                    <p className="text-[11px] text-gray-600">Secure Direct Merchant Scanner</p>
                    
                    <div className="my-3 mx-auto w-44 h-44 bg-white border-2 border-indigo-300 rounded-2xl flex items-center justify-center p-2 shadow-md">
                      <img src="/upi-qr.png" alt="Direct UPI QR Code" className="w-full h-full object-contain rounded-lg" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-900 mb-1">
                      UTR / Transaction Reference ID <span className="text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={upiUtr}
                      onChange={(e) => setUpiUtr(e.target.value)}
                      placeholder="e.g. 4235xxxxxxxx (Optional)"
                      className="w-full border border-indigo-300 p-2.5 rounded-xl text-sm bg-white font-mono font-bold text-gray-900 focus:outline-indigo-600"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">You can place your order even without entering the UTR. Our team will cross-verify the incoming payment in our bank account statement.</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || cart.length === 0 || allDisabled}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-lg transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Processing Order...' : allDisabled ? 'Payments Not Accepting Currently' : `Place Order • ₹${totalPrice}`}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-3 mb-4">
              Order Summary ({cart.reduce((total, i) => total + (Number(i.quantity) || 1), 0)} items)
            </h3>

            {cart.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-gray-400 mb-3">No items found in cart.</p>
                <Link href="/cart" className="text-xs font-bold text-indigo-600 hover:underline">
                  Go to Cart Page
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => {
                  const firstImg = item.image_url
                    ? item.image_url.split(',')[0].trim()
                    : 'https://via.placeholder.com/50'
                  const unitPrice = Number(item.price) || 0
                  const qty = Number(item.quantity) || 1
                  const itemTotal = unitPrice * qty

                  return (
                    <div key={item.id} className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <img
                        src={firstImg}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg border bg-white flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                        <p className="text-[11px] text-gray-500">
                          ₹{unitPrice} × {qty}
                        </p>
                      </div>
                      <div className="text-xs font-bold text-gray-900 whitespace-nowrap">
                        ₹{itemTotal}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="border-t pt-4 mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{totalPrice}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-sm font-black text-indigo-950 border-t pt-2">
                <span>Total Payable</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}