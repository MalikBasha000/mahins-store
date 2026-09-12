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

  // Coupon & Discount States
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')

  // Shipping Calculation States
  const [shippingFee, setShippingFee] = useState(0)
  const [processingFee, setProcessingFee] = useState(0)
  const [estimatedDelivery, setEstimatedDelivery] = useState('3 - 5 Business Days')
  const [courierName, setCourierName] = useState('Shiprocket Surface Standard')
  const [shippingLoading, setShippingLoading] = useState(false)

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

  const totalCartItemsCount = cart.reduce((total, i) => total + (Number(i.quantity) || 1), 0)

  const fetchShippingRates = async (targetPincode: string, currentCartItems = cart) => {
    if (!targetPincode || targetPincode.trim().length !== 6 || currentCartItems.length === 0) {
      return
    }
    setShippingLoading(true)
    try {
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryPincode: targetPincode.trim(),
          items: currentCartItems.map(item => ({
            id: item.id,
            quantity: Number(item.quantity) || 1
          }))
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShippingFee(Number(data.shippingFee) || 0)
        setProcessingFee(Number(data.processingFee) || 0)
        setEstimatedDelivery(data.estimatedDelivery || '3 - 5 Business Days')
        setCourierName(data.courierName || 'Shiprocket Surface Standard')
      }
    } catch (err) {
      console.error('Failed to fetch shipping rate:', err)
    } finally {
      setShippingLoading(false)
    }
  }

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
            if (data.pincode) {
              setPincode(data.pincode)
              fetchShippingRates(data.pincode, cart)
            }
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

  // Recalculate shipping whenever cart items or quantities change
  useEffect(() => {
    if (pincode && pincode.trim().length === 6 && cart.length > 0) {
      fetchShippingRates(pincode, cart)
    }
  }, [cart])

  // Determine active payment method availability
  useEffect(() => {
    const isRazorpayActive = paymentSettings.is_razorpay_enabled
    const isUpiActive = paymentSettings.is_upi_enabled
    const isCodActive = isLoggedIn && paymentSettings.is_cod_enabled

    if (isRazorpayActive) setPaymentMethod('Online Gateway (Razorpay)')
    else if (isUpiActive) setPaymentMethod('Direct UPI Transfer (Scan & Pay)')
    else if (isCodActive) setPaymentMethod('Cash on Delivery (COD)')
    else setPaymentMethod('')
  }, [paymentSettings, isLoggedIn])

  // Calculate discount, shipping, and final payable amounts
  const discountAmount = appliedCoupon 
    ? (appliedCoupon.discount_type === 'percentage' 
        ? (totalPrice * appliedCoupon.discount_value) / 100 
        : appliedCoupon.discount_value)
    : 0

  const totalShippingAndProcessing = shippingFee + processingFee
  const finalPayableAmount = Math.max(0, totalPrice - discountAmount + totalShippingAndProcessing)

  const handleApplyCoupon = async () => {
    setCouponError('')
    if (!couponInput.trim()) return

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponInput.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) {
      setCouponError('Invalid or inactive coupon code.')
      return
    }

    if (data.target_customer_email) {
      const currentUserEmail = (email || '').trim().toLowerCase()
      if (!currentUserEmail || currentUserEmail !== data.target_customer_email.toLowerCase()) {
        setCouponError('This coupon code is not valid for your account.')
        return
      }
    }

    if (totalPrice < (data.min_order_amount || 0)) {
      setCouponError(`Minimum order amount of ₹${data.min_order_amount} required for this code.`)
      return
    }

    setAppliedCoupon(data)
    setCouponInput('')
  }

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value
    setPincode(pin)
    if (pin.length === 6 && /^\d+$/.test(pin)) {
      fetchShippingRates(pin, cart)
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

    if (appliedCoupon) {
      finalPaymentMethod += ` [Coupon: ${appliedCoupon.code} - ₹${discountAmount} OFF]`
    }

    const initialOrderStatus = paymentMethod === 'Direct UPI Transfer (Scan & Pay)' ? 'PENDING VERIFICATION' : 'Pending'

    const orderPayload: any = {
      user_id: currentUserId,
      customer_email: userEmail.toLowerCase().trim(),
      tracking_id: newTrackingId,
      customer_name: name,
      customer_phone: formattedPhone,
      shipping_address: formattedAddress,
      shipping_address_snapshot: addressSnapshotObj,
      payment_method: finalPaymentMethod,
      total_amount: totalPrice + totalShippingAndProcessing,
      final_payable_amount: finalPayableAmount,
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
            total_amount: finalPayableAmount,
            estimated_delivery: estimatedDelivery,
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

    if (!pincode || pincode.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit delivery pincode.')
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
          body: JSON.stringify({ amount: finalPayableAmount }),
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
            color: "#B76E79",
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
    return <div className="min-h-screen bg-[#F4EADE] flex items-center justify-center text-xs sm:text-sm text-[#8A7968] font-bold">Loading checkout...</div>
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#F4EADE] flex items-center justify-center p-4 text-[#2B2B2B]">
        <div className="bg-[#EFE3D3] rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 max-w-lg w-full text-center border border-[#8A7968]/30">
          <div className="text-4xl sm:text-5xl mb-4">🎉</div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2B2B2B] mb-2">Order Placed Successfully!</h1>
          <p className="text-xs sm:text-sm text-[#8A7968] mb-6">
            Thank you for shopping with Mahin's One-Stop One-Store.
          </p>

          <div className="bg-[#F4EADE] border border-[#8A7968]/30 rounded-2xl p-4 sm:p-5 mb-6">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-[#B76E79] tracking-wider uppercase block mb-1">
              Your 16-Digit Tracking ID
            </span>
            <div className="text-base sm:text-xl font-mono font-extrabold text-[#2B2B2B] tracking-wider break-all">
              {trackingId}
            </div>
            <div className="mt-2.5 pt-2 border-t border-[#8A7968]/20 flex items-center justify-between text-xs text-[#8A7968]">
              <span>Estimated Delivery:</span>
              <span className="font-bold text-[#2B2B2B]">{estimatedDelivery}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="w-full sm:w-1/2 py-3 bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] font-bold rounded-xl text-xs sm:text-sm transition text-center border border-[#8A7968]/30 btn-press"
            >
              Return to Store
            </Link>
            <Link
              href={`/track?id=${trackingId}`}
              className="w-full sm:w-1/2 py-3 bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-1.5 btn-press"
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
    <div className="min-h-screen bg-[#F4EADE] text-[#2B2B2B] pb-24 sm:pb-16 w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-[#EFE3D3] border-b border-[#8A7968]/30 px-4 sm:px-6 py-3.5 sm:py-4 mb-6 sm:mb-8 shadow-xs w-full">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <Link href="/" className="hover:opacity-90 transition min-w-0">
            <h1 className="text-base sm:text-xl font-black text-[#2B2B2B] truncate">
              Mahin's One-Stop One-Store
            </h1>
          </Link>
          <Link href="/cart" className="text-xs font-bold text-[#B76E79] hover:underline shrink-0 whitespace-nowrap">
            ← Back to Cart
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 w-full">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#2B2B2B]">Secure Checkout</h2>
          <p className="text-xs text-[#8A7968] mt-1">Review your items and complete shipping details</p>
        </div>

        {!isLoggedIn && (
          <div className="mb-6 p-4 bg-[#EFE3D3] border border-[#8A7968]/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-xs font-bold text-[#2B2B2B] leading-relaxed">
              💡 Checking out as guest? You can place prepaid orders instantly. <Link href="/login" className="text-[#B76E79] underline font-bold">Sign In</Link> or <Link href="/signup" className="text-[#B76E79] underline font-bold">Create an Account</Link> to unlock Cash on Delivery (COD).
            </div>
            <Link href="/login" className="bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition shrink-0 btn-press">
              Sign In 🔒
            </Link>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-3.5 sm:p-4 bg-red-100 text-red-700 rounded-xl text-xs font-semibold border border-red-200">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full">
          <div className="md:col-span-2 bg-[#EFE3D3] rounded-2xl sm:rounded-3xl shadow-xs border border-[#8A7968]/30 p-4 sm:p-6 w-full">
            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <h3 className="text-xs font-bold text-[#2B2B2B] uppercase tracking-wider border-b border-[#8A7968]/20 pb-2">
                1. Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] bg-[#F4EADE] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden font-medium min-w-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] bg-[#F4EADE] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden font-medium min-w-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Mobile Number *</label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 border border-[#8A7968]/40 bg-[#EADBC8] rounded-xl text-xs sm:text-sm font-semibold text-[#2B2B2B] shrink-0">
                    {countryCode}
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="flex-1 min-w-0 border border-[#8A7968]/40 p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] bg-[#F4EADE] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <h3 className="text-xs font-bold text-[#2B2B2B] uppercase tracking-wider border-b border-[#8A7968]/20 pb-2 pt-4">
                2. Shipping Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">House No. *</label>
                  <input
                    type="text"
                    required
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    placeholder="House No."
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] bg-[#F4EADE] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden font-medium min-w-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Plot No.</label>
                  <input
                    type="text"
                    value={plotNo}
                    onChange={(e) => setPlotNo(e.target.value)}
                    placeholder="Plot No."
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] bg-[#F4EADE] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden font-medium min-w-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Street / Line *</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street / Line"
                  className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] bg-[#F4EADE] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden font-medium min-w-0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Pincode (Auto-fills & calculates shipping) *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={handlePincodeChange}
                  placeholder="6-digit Pincode"
                  className="w-full border border-[#8A7968]/50 bg-[#EADBC8]/70 p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden min-w-0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] bg-[#F4EADE] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden font-medium min-w-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="District"
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] bg-[#F4EADE] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden font-medium min-w-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2B2B] mb-1">State *</label>
                <select
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] bg-[#F4EADE] focus:border-[#B76E79] focus:outline-hidden font-medium min-w-0"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <h3 className="text-xs font-bold text-[#2B2B2B] uppercase tracking-wider border-b border-[#8A7968]/20 pb-2 pt-4">
                3. Payment Method
              </h3>

              {allDisabled ? (
                <div className="p-4 bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 text-center">
                  {paymentSettings.cod_message || 'Payments not accepting currently'}
                </div>
              ) : (
                <div className="space-y-2">
                  {isRazorpayActive && (
                    <label
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                        paymentMethod === 'Online Gateway (Razorpay)' ? 'border-[#B76E79] bg-[#B76E79]/15' : 'border-[#8A7968]/30 bg-[#F4EADE] hover:bg-[#EADBC8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Online Gateway (Razorpay)"
                        checked={paymentMethod === 'Online Gateway (Razorpay)'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-[#B76E79]"
                      />
                      <span className="text-xs font-bold text-[#2B2B2B]">Online Gateway (Razorpay)</span>
                    </label>
                  )}

                  {isUpiActive && (
                    <label
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                        paymentMethod === 'Direct UPI Transfer (Scan & Pay)' ? 'border-[#B76E79] bg-[#B76E79]/15' : 'border-[#8A7968]/30 bg-[#F4EADE] hover:bg-[#EADBC8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Direct UPI Transfer (Scan & Pay)"
                        checked={paymentMethod === 'Direct UPI Transfer (Scan & Pay)'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-[#B76E79]"
                      />
                      <span className="text-xs font-bold text-[#2B2B2B]">Direct UPI Transfer (Scan & Pay)</span>
                    </label>
                  )}

                  {isCodActive && (
                    <label
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${
                        paymentMethod === 'Cash on Delivery (COD)' ? 'border-[#B76E79] bg-[#B76E79]/15' : 'border-[#8A7968]/30 bg-[#F4EADE] hover:bg-[#EADBC8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Cash on Delivery (COD)"
                        checked={paymentMethod === 'Cash on Delivery (COD)'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-[#B76E79]"
                      />
                      <span className="text-xs font-bold text-[#2B2B2B]">Cash on Delivery (COD)</span>
                    </label>
                  )}

                  {!isLoggedIn && paymentSettings.is_cod_enabled && (
                    <div className="p-3 bg-[#EADBC8] border border-[#8A7968]/40 rounded-xl text-[11px] text-[#2B2B2B] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                      <span>🔒 Cash on Delivery is locked for guest checkouts.</span>
                      <Link href="/login" className="font-bold underline text-[#B76E79]">Sign in to unlock COD</Link>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'Direct UPI Transfer (Scan & Pay)' && isUpiActive && (
                <div className="bg-[#EADBC8]/50 p-4 sm:p-5 rounded-2xl border border-[#8A7968]/30 space-y-4">
                  <div className="text-center">
                    <span className="text-xs font-bold text-[#2B2B2B] uppercase tracking-wide block mb-1">Scan QR Code with any UPI App</span>
                    <p className="text-[11px] text-[#8A7968]">Secure Direct Merchant Scanner</p>
                    
                    <div className="my-3 mx-auto w-40 h-40 sm:w-44 sm:h-44 bg-[#F4EADE] border-2 border-[#8A7968]/40 rounded-2xl flex items-center justify-center p-2 shadow-xs">
                      <img src="/upi-qr.png" alt="Direct UPI QR Code" className="w-full h-full object-contain rounded-lg" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2B2B2B] mb-1">
                      UTR / Transaction Reference ID <span className="text-[#8A7968] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={upiUtr}
                      onChange={(e) => setUpiUtr(e.target.value)}
                      placeholder="e.g. 4235xxxxxxxx (Optional)"
                      className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs sm:text-sm bg-[#F4EADE] font-mono font-bold text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden min-w-0"
                    />
                    <p className="text-[10px] text-[#8A7968] mt-1">You can place your order even without entering the UTR. Our team will cross-verify the incoming payment in our bank account statement.</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || cart.length === 0 || allDisabled}
                className="w-full mt-6 bg-[#B76E79] hover:bg-[#9E5B65] text-white font-extrabold py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm shadow-xs transition disabled:opacity-50 cursor-pointer btn-press"
              >
                {loading ? 'Processing Order...' : allDisabled ? 'Payments Not Accepting Currently' : `Place Order • ₹${finalPayableAmount}`}
              </button>
            </form>
          </div>

          <div className="space-y-4 sm:space-y-6 w-full">
            {/* Delivery Time & Courier Details Box */}
            <div className="bg-[#EFE3D3] rounded-2xl sm:rounded-3xl shadow-xs border border-[#8A7968]/30 p-4 sm:p-5 w-full">
              <span className="text-[10px] font-extrabold text-[#B76E79] uppercase tracking-wider block mb-1">
                Estimated Delivery
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-[#2B2B2B]">
                  🚚 {estimatedDelivery}
                </span>
                <span className="text-[10px] bg-[#EADBC8] text-[#2B2B2B] font-bold px-2 py-0.5 rounded-lg border border-[#8A7968]/30">
                  Surface
                </span>
              </div>
              <p className="text-[11px] text-[#8A7968] mt-1">
                Shipped via {courierName}. Deliveries typically arrive within 3 to 5 business days from the date of order.
              </p>
            </div>

            {/* Coupon Box */}
            <div className="bg-[#EFE3D3] rounded-2xl sm:rounded-3xl shadow-xs border border-[#8A7968]/30 p-4 sm:p-6 w-full">
              <h3 className="text-xs font-bold text-[#2B2B2B] uppercase tracking-wider border-b border-[#8A7968]/20 pb-3 mb-4">
                Discount Coupon 🏷️
              </h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter promo code"
                    className="border border-[#8A7968]/40 p-2.5 rounded-xl text-xs uppercase font-mono bg-[#F4EADE] text-[#2B2B2B] flex-1 min-w-0 focus:border-[#B76E79] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition shadow-xs shrink-0 btn-press"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-red-700 text-[11px] font-semibold">{couponError}</p>}
                {appliedCoupon && (
                  <div className="flex justify-between items-center bg-green-100 text-green-800 p-2.5 rounded-xl text-xs border border-green-300">
                    <span className="truncate pr-2">Applied: <b>{appliedCoupon.code}</b> ({appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `₹${appliedCoupon.discount_value}`} OFF)</span>
                    <button type="button" onClick={() => setAppliedCoupon(null)} className="text-red-600 font-bold hover:underline cursor-pointer shrink-0">Remove</button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Box */}
            <div className="bg-[#EFE3D3] rounded-2xl sm:rounded-3xl shadow-xs border border-[#8A7968]/30 p-4 sm:p-6 h-fit w-full">
              <h3 className="text-xs font-bold text-[#2B2B2B] uppercase tracking-wider border-b border-[#8A7968]/20 pb-3 mb-4">
                Order Summary ({totalCartItemsCount} items)
              </h3>

              {cart.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-[#8A7968] mb-3">No items found in cart.</p>
                  <Link href="/cart" className="text-xs font-bold text-[#B76E79] hover:underline">
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
                      <div key={item.id} className="flex items-center gap-3 border-b border-[#8A7968]/20 pb-3">
                        <img
                          src={firstImg}
                          alt={item.name}
                          className="w-12 h-12 object-contain rounded-xl border border-[#8A7968]/30 bg-[#F4EADE] shrink-0 p-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#2B2B2B] truncate">{item.name}</h4>
                          <p className="text-[11px] text-[#8A7968]">
                            ₹{unitPrice} × {qty}
                          </p>
                        </div>
                        <div className="text-xs font-bold text-[#2B2B2B] shrink-0">
                          ₹{itemTotal}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="border-t border-[#8A7968]/20 pt-4 mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#8A7968]">
                  <span>Subtotal</span>
                  <span>₹{totalPrice}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-green-800 font-bold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#8A7968]">
                  <div className="flex flex-col">
                    <span>Shipping Charges</span>
                    <span className="text-[10px] text-[#8A7968]">
                      Calculated per product rules
                    </span>
                  </div>
                  <span className="font-bold text-[#2B2B2B]">
                    {shippingLoading ? 'Calculating...' : `₹${shippingFee}`}
                  </span>
                </div>

                {processingFee > 0 && (
                  <div className="flex justify-between text-[#8A7968]">
                    <span>Handling / Processing</span>
                    <span className="font-bold text-[#2B2B2B]">₹{processingFee}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-black text-[#2B2B2B] border-t border-[#8A7968]/20 pt-2">
                  <span>Total Payable</span>
                  <span>₹{finalPayableAmount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}