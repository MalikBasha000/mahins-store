// app/admin/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'
import OrderInvoiceModal from './OrderInvoiceModal'
import SalesCharts from './SalesCharts'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const ADMIN_EMAIL = 'mahinsonestoponestore@gmail.com'
  const ADMIN_PASS = 'tonystark@1986'
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [authStep, setAuthStep] = useState<'credentials' | 'otp' | 'forgot_password'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otpToken, setOtpToken] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  
  const [activeTab, setActiveTab] = useState<'analytics' | 'upi_verifications' | 'orders' | 'products' | 'customers' | 'coupons' | 'banners' | 'payments' | 'reviews'>('analytics')
  const [activeAdminOrderTab, setActiveAdminOrderTab] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    is_razorpay_enabled: true,
    is_upi_enabled: true,
    is_cod_enabled: true,
    cod_message: 'Payments not accepting currently'
  })

  // Coupons Management State
  const [coupons, setCoupons] = useState<any[]>([])
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscountType, setCouponDiscountType] = useState('percentage')
  const [couponDiscountValue, setCouponDiscountValue] = useState('')
  const [couponMinOrder, setCouponMinOrder] = useState('')
  const [couponTargetEmail, setCouponTargetEmail] = useState('')

  // Edit Coupon Modal State
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null)
  const [editCouponCode, setEditCouponCode] = useState('')
  const [editCouponDiscountType, setEditCouponDiscountType] = useState('percentage')
  const [editCouponDiscountValue, setEditCouponDiscountValue] = useState('')
  const [editCouponMinOrder, setEditCouponMinOrder] = useState('')
  const [editCouponTargetEmail, setEditCouponTargetEmail] = useState('')

  // Banners & Posters Management State
  const [banners, setBanners] = useState<any[]>([])
  const [bannerTitle, setBannerTitle] = useState('')
  const [bannerImageUrl, setBannerImageUrl] = useState('')
  const [bannerTargetEmail, setBannerTargetEmail] = useState('')
  const [uploadingPoster, setUploadingPoster] = useState(false)

  // Edit Banner Modal State
  const [editingBanner, setEditingBanner] = useState<any | null>(null)
  const [editBannerTitle, setEditBannerTitle] = useState('')
  const [editBannerImageUrl, setEditBannerImageUrl] = useState('')
  const [editBannerTargetEmail, setEditBannerTargetEmail] = useState('')
  const [uploadingEditPoster, setUploadingEditPoster] = useState(false)

  // Reviews Moderation State
  const [adminReviews, setAdminReviews] = useState<any[]>([])
  const [editingReview, setReviewEditing] = useState<any | null>(null)
  const [editReviewComment, setEditReviewComment] = useState('')
  const [editReviewRating, setEditReviewRating] = useState(5)

  // Inventory Products State & Bundles/Kits State
  const [products, setProducts] = useState<any[]>([])
  const [bundleMap, setBundleMap] = useState<Record<string, any[]>>({})
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [baseShippingFee, setBaseShippingFee] = useState('120')
  const [extraShippingFee, setExtraShippingFee] = useState('80')
  const [imageInputs, setImageInputs] = useState<string[]>([''])

  // Kit creation form states
  const [isBundle, setIsBundle] = useState(false)
  const [kitComponents, setKitComponents] = useState<{ component_id: string; quantity: number }[]>([])

  // Products Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL')
  const [stockFilter, setStockFilter] = useState('ALL')

  // Product Editing & Preview State
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editStock, setEditStock] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editBaseShippingFee, setEditBaseShippingFee] = useState('120')
  const [editExtraShippingFee, setEditExtraShippingFee] = useState('80')
  const [editImageInputs, setEditImageInputs] = useState<string[]>([''])
  const [editIsBundle, setEditIsBundle] = useState(false)
  const [editKitComponents, setEditKitComponents] = useState<{ component_id: string; quantity: number }[]>([])

  const [viewingProduct, setViewingProduct] = useState<any | null>(null)
  const [activePreviewImage, setActivePreviewImage] = useState('')

  // Stock Audit Logs Modal State
  const [auditingProduct, setAuditingProduct] = useState<any | null>(null)
  const [productAuditLogs, setProductAuditLogs] = useState<any[]>([])

  // Image Gallery Modal State
  const [activeOrderGalleryImages, setActiveOrderGalleryImages] = useState<string[] | null>(null)
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0)

  // Orders State & Filters
  const [orders, setOrders] = useState<any[]>([])
  const [orderSearchQuery, setOrderSearchQuery] = useState('')
  const [orderAmountSort, setOrderAmountSort] = useState<'DEFAULT' | 'HIGH_TO_LOW' | 'LOW_TO_HIGH'>('DEFAULT')
  const [minAmountFilter, setMinAmountFilter] = useState('')
  const [maxAmountFilter, setMaxAmountFilter] = useState('')

  // UPI Verifications Filter State
  const [upiSearchQuery, setUpiSearchQuery] = useState('')
  const [upiStatusFilter, setUpiStatusFilter] = useState('ALL')

  // Invoice & Packing Slip Modal State
  const [activePrintOrder, setActivePrintOrder] = useState<{
    order: any
    type: 'INVOICE' | 'PACKING_SLIP'
  } | null>(null)

  // Customers Tab State & Customer Details Modal
  const [customers, setCustomers] = useState<any[]>([])
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null)

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAdminData()
    }
  }, [activeTab, isAdminAuthenticated])

  useEffect(() => {
    if (!isAdminAuthenticated) return
    if (activeTab === 'payments') fetchPaymentSettings()
    if (activeTab === 'reviews') fetchAdminReviews()
    if (activeTab === 'coupons') fetchCoupons()
    if (activeTab === 'banners') fetchBanners()
  }, [activeTab, isAdminAuthenticated])

  const fetchPaymentSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data.success && data.settings) {
        setPaymentSettings(data.settings)
      }
    } catch (err) {
      console.error('Failed to load payment settings', err)
    }
  }

  const fetchAdminReviews = async () => {
    try {
      const res = await fetch('/api/reviews?admin_fetch=true')
      const data = await res.json()
      if (data.success) {
        setAdminReviews(data.reviews)
      }
    } catch (err) {
      console.error('Failed to load reviews', err)
    }
  }

  const handleToggleReviewApproval = async (reviewId: string, currentApprovalStatus: boolean) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          is_approved: !currentApprovalStatus,
        }),
      })
      const data = await res.json()
      if (data.success) {
        fetchAdminReviews()
      } else {
        alert(data.error || 'Failed to update review approval status.')
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const fetchCoupons = async () => {
    try {
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setCoupons(data)
    } catch (err) {
      console.error('Failed to fetch coupons', err)
    }
  }

  const fetchBanners = async () => {
    try {
      const { data } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setBanners(data)
    } catch (err) {
      console.error('Failed to fetch banners', err)
    }
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim() || !couponDiscountValue) {
      alert('Please fill in coupon code and discount value.')
      return
    }

    const { error } = await supabase.from('coupons').insert([
      {
        code: couponCode.trim().toUpperCase(),
        discount_type: couponDiscountType,
        discount_value: Number(couponDiscountValue),
        min_order_amount: Number(couponMinOrder) || 0,
        target_customer_email: couponTargetEmail.trim() ? couponTargetEmail.trim().toLowerCase() : null,
        is_active: true
      }
    ])

    if (error) {
      alert(`Error creating coupon: ${error.message}`)
      return
    }

    setCouponCode('')
    setCouponDiscountValue('')
    setCouponMinOrder('')
    setCouponTargetEmail('')
    fetchCoupons()
    alert('Coupon created successfully!')
  }

  const openEditCouponModal = (c: any) => {
    setEditingCoupon(c)
    setEditCouponCode(c.code || '')
    setEditCouponDiscountType(c.discount_type || 'percentage')
    setEditCouponDiscountValue(c.discount_value || '')
    setEditCouponMinOrder(c.min_order_amount || '')
    setEditCouponTargetEmail(c.target_customer_email || '')
  }

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCoupon) return

    const { error } = await supabase
      .from('coupons')
      .update({
        code: editCouponCode.trim().toUpperCase(),
        discount_type: editCouponDiscountType,
        discount_value: Number(editCouponDiscountValue),
        min_order_amount: Number(editCouponMinOrder) || 0,
        target_customer_email: editCouponTargetEmail.trim() ? editCouponTargetEmail.trim().toLowerCase() : null,
      })
      .eq('id', editingCoupon.id)

    if (error) {
      alert(`Error updating coupon: ${error.message}`)
      return
    }

    setEditingCoupon(null)
    fetchCoupons()
    alert('Coupon updated successfully!')
  }

  const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id)
    fetchCoupons()
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    await supabase.from('coupons').delete().eq('id', id)
    fetchCoupons()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (isEdit) setUploadingEditPoster(true)
    else setUploadingPoster(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('store-posters')
        .upload(filePath, file)

      if (uploadError) {
        alert(`Error uploading file: ${uploadError.message}`)
        if (isEdit) setUploadingEditPoster(false)
        else setUploadingPoster(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('store-posters')
        .getPublicUrl(filePath)

      if (isEdit) {
        setEditBannerImageUrl(publicUrl)
      } else {
        setBannerImageUrl(publicUrl)
      }
      alert('Poster image uploaded successfully!')
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`)
    }

    if (isEdit) setUploadingEditPoster(false)
    else setUploadingPoster(false)
  }

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bannerTitle.trim() || !bannerImageUrl.trim()) {
      alert('Please provide a title and poster image URL.')
      return
    }

    const { error } = await supabase.from('banners').insert([{
      title: bannerTitle.trim(),
      image_url: bannerImageUrl.trim(),
      target_customer_email: bannerTargetEmail.trim() ? bannerTargetEmail.trim().toLowerCase() : null,
      is_active: true
    }])

    if (error) {
      alert(`Error: ${error.message}`)
      return
    }

    setBannerTitle('')
    setBannerImageUrl('')
    setBannerTargetEmail('')
    fetchBanners()
    alert('Poster published successfully!')
  }

  const openEditBannerModal = (b: any) => {
    setEditingBanner(b)
    setEditBannerTitle(b.title || '')
    setEditBannerImageUrl(b.image_url || '')
    setEditBannerTargetEmail(b.target_customer_email || '')
  }

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBanner) return

    const { error } = await supabase
      .from('banners')
      .update({
        title: editBannerTitle.trim(),
        image_url: editBannerImageUrl.trim(),
        target_customer_email: editBannerTargetEmail.trim() ? editBannerTargetEmail.trim().toLowerCase() : null,
      })
      .eq('id', editingBanner.id)

    if (error) {
      alert(`Error updating poster: ${error.message}`)
      return
    }

    setEditingBanner(null)
    fetchBanners()
    alert('Poster updated successfully!')
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this poster?')) return
    await supabase.from('banners').delete().eq('id', id)
    fetchBanners()
  }

  const handleAdminDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchAdminReviews()
        alert('Review deleted successfully.')
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleAdminUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReview) return
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: editingReview.id,
          rating: editReviewRating,
          comment: editReviewComment.trim(),
          image_url: editingReview.image_url
        })
      })
      const data = await res.json()
      if (data.success) {
        setReviewEditing(null)
        fetchAdminReviews()
        alert('Review updated successfully!')
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentSettings)
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg('Payment gateway configurations saved successfully!')
      } else {
        setErrorMsg(data.error || 'Failed to save payment settings.')
      }
    } catch (err: any) {
      setErrorMsg(`Error: ${err.message}`)
    }
    setLoading(false)
  }

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    
    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASS) {
      setErrorMsg('Invalid admin email or password.')
      return
    }

    setLoading(true)
    const uniqueOtp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(uniqueOtp)

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: uniqueOtp }),
      })

      const data = await res.json()
      if (data.success) {
        setSuccessMsg(`Secure OTP has been sent successfully to ${email}!`)
        setAuthStep('otp')
      } else {
        setErrorMsg(`Failed to send email: ${data.error || 'Check server configuration'}`)
      }
    } catch (err: any) {
      setErrorMsg(`Network error: ${err.message}`)
    }
    setLoading(false)
  }

  const handleAdminForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin-forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setGeneratedOtp(data.otp)
        setSuccessMsg(`Admin access OTP has been sent to ${email.trim()}!`)
        setAuthStep('otp')
      } else {
        setErrorMsg(data.error || 'Failed to send recovery OTP.')
      }
    } catch (err: any) {
      setErrorMsg(`Network error: ${err.message}`)
    }
    setLoading(false)
  }

  const handleVerifyEmailOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (otpToken.trim() === generatedOtp) {
      setIsAdminAuthenticated(true)
      setSuccessMsg('Admin authentication successful!')
    } else {
      setErrorMsg('Invalid OTP token. Please check your inbox and try again.')
    }
  }

  const handleLogout = () => {
    setIsAdminAuthenticated(false)
    setAuthStep('credentials')
    setEmail('')
    setPassword('')
    setOtpToken('')
    setSuccessMsg('')
    setErrorMsg('')
  }

  const fetchAdminData = async () => {
    setLoading(true)
    setErrorMsg('')

    const { data: prodData, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (prodErr) setErrorMsg(prodErr.message)
    else setProducts(prodData || [])

    // Fetch bundle recipes mapping
    try {
      const { data: bundleData } = await supabase
        .from('bundle_items')
        .select('*')
      if (bundleData) {
        const mapping: Record<string, any[]> = {}
        bundleData.forEach((item: any) => {
          if (!mapping[item.bundle_id]) mapping[item.bundle_id] = []
          mapping[item.bundle_id].push(item)
        })
        setBundleMap(mapping)
      }
    } catch (err) {
      console.error('Error fetching bundle recipes:', err)
    }

    try {
      const res = await fetch('/api/admin/orders')
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders || [])
      } else {
        const { data: clientOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
        setOrders(clientOrders || [])
      }
    } catch {
      const { data: clientOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      setOrders(clientOrders || [])
    }

    try {
      const res = await fetch('/api/admin/customers')
      const data = await res.json()
      if (data.success) {
        setCustomers(data.customers || data.data || [])
      }
    } catch (err: any) {
      console.error('Failed to load customers:', err)
    }

    fetchCoupons()
    fetchBanners()
    setLoading(false)
  }

  const handleAddImageInput = () => setImageInputs([...imageInputs, ''])
  const handleImageInputChange = (index: number, value: string) => {
    const updated = [...imageInputs]
    updated[index] = value
    setImageInputs(updated)
  }
  const handleRemoveImageInput = (index: number) => {
    setImageInputs(imageInputs.filter((_, i) => i !== index))
  }

  const handleAddEditImageInput = () => setEditImageInputs([...editImageInputs, ''])
  const handleEditImageInputChange = (index: number, value: string) => {
    const updated = [...editImageInputs]
    updated[index] = value
    setEditImageInputs(updated)
  }
  const handleRemoveEditImageInput = (index: number) => {
    setEditImageInputs(editImageInputs.filter((_, i) => i !== index))
  }

  const calculateBundleStock = (bundleId: string, customComponents?: { component_id: string; quantity: number }[]) => {
    const components = customComponents || bundleMap[bundleId] || []
    if (components.length === 0) return 0
    let minStock = Infinity
    for (const comp of components) {
      const rawProduct = products.find(p => p.id === comp.component_id)
      const stockAvailable = rawProduct ? (rawProduct.stock || 0) : 0
      const qtyRequired = Math.max(1, comp.quantity || 1)
      const possibleKits = Math.floor(stockAvailable / qtyRequired)
      if (possibleKits < minStock) {
        minStock = possibleKits
      }
    }
    return minStock === Infinity ? 0 : minStock
  }

  const handleAddKitComponent = (isEditingMode = false) => {
    const defaultProduct = products.find(p => !p.is_bundle)
    if (!defaultProduct) {
      alert('Please add at least one standalone inventory product first.')
      return
    }
    if (isEditingMode) {
      setEditKitComponents([...editKitComponents, { component_id: defaultProduct.id, quantity: 1 }])
    } else {
      setKitComponents([...kitComponents, { component_id: defaultProduct.id, quantity: 1 }])
    }
  }

  const handleUpdateKitComponent = (index: number, field: 'component_id' | 'quantity', value: any, isEditingMode = false) => {
    if (isEditingMode) {
      const updated = [...editKitComponents]
      updated[index] = { ...updated[index], [field]: value }
      setEditKitComponents(updated)
    } else {
      const updated = [...kitComponents]
      updated[index] = { ...updated[index], [field]: value }
      setKitComponents(updated)
    }
  }

  const handleRemoveKitComponent = (index: number, isEditingMode = false) => {
    if (isEditingMode) {
      setEditKitComponents(editKitComponents.filter((_, i) => i !== index))
    } else {
      setKitComponents(kitComponents.filter((_, i) => i !== index))
    }
  }

  // Uses the admin API endpoint to safely bypass RLS
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (isBundle && kitComponents.length === 0) {
      alert('Please add at least one component to your kit recipe.')
      return
    }

    const filteredImages = imageInputs.filter(url => url.trim() !== '').join(',')
    const calculatedStock = isBundle ? calculateBundleStock('', kitComponents) : (parseInt(stock) || 0)

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, 
          price: parseFloat(price), 
          stock: calculatedStock, 
          category: isBundle ? (category.trim() || 'Kits & Bundles') : category.trim(), 
          description,
          base_shipping_fee: parseFloat(baseShippingFee) || 120,
          extra_shipping_fee: parseFloat(extraShippingFee) || 80,
          is_bundle: isBundle,
          image_url: filteredImages,
          components: isBundle ? kitComponents : []
        })
      })

      const data = await res.json()

      if (data.success) {
        setSuccessMsg(isBundle ? '🎉 Lab Kit created successfully!' : 'Product added successfully!')
        setName('')
        setPrice('')
        setStock('')
        setCategory('')
        setDescription('')
        setIsBundle(false)
        setKitComponents([])
        setBaseShippingFee('120')
        setExtraShippingFee('80')
        setImageInputs([''])
        fetchAdminData()
      } else {
        setErrorMsg(`Failed to add item: ${data.error}`)
      }
    } catch (err: any) {
      setErrorMsg(`Network error: ${err.message}`)
    }
  }

  const openEditModal = (p: any) => {
    setEditingProduct(p)
    setEditName(p.name || p.title || '')
    setEditPrice(p.price || '')
    setEditStock(p.stock || '')
    setEditCategory(p.category || '')
    setEditDescription(p.description || '')
    setEditBaseShippingFee(String(p.base_shipping_fee ?? 120))
    setEditExtraShippingFee(String(p.extra_shipping_fee ?? 80))
    setEditIsBundle(Boolean(p.is_bundle))
    
    const existingRecipe = bundleMap[p.id] || []
    setEditKitComponents(existingRecipe.map(item => ({ component_id: item.component_id, quantity: item.quantity })))

    const existingImgs = p.image_url ? p.image_url.split(',').map((s: string) => s.trim()) : ['']
    setEditImageInputs(existingImgs.length > 0 ? existingImgs : [''])
  }

  const openCustomerPreview = (p: any) => {
    setViewingProduct(p)
    const imgs = p.image_url ? p.image_url.split(',').map((s: string) => s.trim()) : []
    setActivePreviewImage(imgs.length > 0 ? imgs[0] : 'https://via.placeholder.com/400')
  }

  const openStockAuditModal = async (p: any) => {
    setAuditingProduct(p)
    try {
      const res = await fetch('/api/admin/orders')
      const data = await res.json()
      const allOrders = data.success ? data.orders : orders
      const matchingLogs = allOrders.filter((order: any) => {
        if (!Array.isArray(order.items)) return false
        return order.items.some((item: any) => (item.id || item.product_id) === p.id || item.name === p.name)
      })
      setProductAuditLogs(matchingLogs)
    } catch {
      const matchingLogs = orders.filter((order: any) => {
        if (!Array.isArray(order.items)) return false
        return order.items.some((item: any) => (item.id || item.product_id) === p.id || item.name === p.name)
      })
      setProductAuditLogs(matchingLogs)
    }
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    const filteredImages = editImageInputs.filter(url => url.trim() !== '').join(',')
    const calculatedStock = editIsBundle ? calculateBundleStock(editingProduct.id, editKitComponents) : (parseInt(editStock) || 0)

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct.id,
          name: editName,
          price: parseFloat(editPrice),
          stock: calculatedStock,
          category: editCategory.trim(),
          description: editDescription,
          base_shipping_fee: parseFloat(editBaseShippingFee) || 120,
          extra_shipping_fee: parseFloat(editExtraShippingFee) || 80,
          is_bundle: editIsBundle,
          image_url: filteredImages,
          components: editIsBundle ? editKitComponents : [],
          updated_at: new Date().toISOString()
        })
      })

      const data = await res.json()

      if (data.success) {
        setSuccessMsg('Product / Kit updated successfully!')
        setEditingProduct(null)
        fetchAdminData()
      } else {
        setErrorMsg(`Failed to update product: ${data.error}`)
      }
    } catch (err: any) {
      setErrorMsg(`Network error: ${err.message}`)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.success) {
        setSuccessMsg('Product deleted successfully!')
        fetchAdminData()
      } else {
        setErrorMsg(`Failed to delete product: ${data.error}`)
      }
    } catch (err: any) {
      setErrorMsg(`Network error: ${err.message}`)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    let customReason = ''
    if (newStatus === 'Cancelled') {
      const reasonInput = prompt('Please enter the reason for rejection/cancellation:')
      if (reasonInput === null) return
      customReason = `Admin rejected UTR / cancelled due to: ${reasonInput.trim() || 'Payment mismatch or invalid UTR'}`
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          newStatus,
          customReason,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccessMsg(`Order status updated to "${newStatus}"! Notification sent to ${data.customerEmail}.`)
        fetchAdminData()
      } else {
        setErrorMsg(data.error || 'Failed to update order status.')
      }
    } catch (err: any) {
      setErrorMsg(`Network error: ${err.message}`)
    }

    setLoading(false)
  }

  const extractUtrNumber = (paymentMethodStr: string) => {
    if (!paymentMethodStr) return 'N/A'
    const match = paymentMethodStr.match(/UTR:\s*([^)]+)/i)
    if (match && match[1]) {
      return match[1].trim()
    }
    return paymentMethodStr
  }

  const getTwelveDigitId = (id: string) => {
    if (!id) return '100000000000'
    let hash1 = 5381
    let hash2 = 52711
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i)
      hash1 = (hash1 * 33) ^ hash2
      hash2 = (hash2 * 33) ^ char
    }
    const combined = Math.abs(hash1).toString().padStart(6, '0') + Math.abs(hash2).toString().padStart(6, '0')
    return combined.slice(0, 12)
  }

  const handleExportCSV = () => {
    if (products.length === 0) {
      alert('No products to export.')
      return
    }

    const headers = ['name', 'price', 'stock', 'category', 'description', 'base_shipping_fee', 'extra_shipping_fee', 'is_bundle', 'image_url']
    const rows = products.map(p => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.price || 0,
      p.is_bundle ? calculateBundleStock(p.id) : (p.stock || 0),
      `"${(p.category || 'General').replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.base_shipping_fee || 120,
      p.extra_shipping_fee || 80,
      p.is_bundle ? 'TRUE' : 'FALSE',
      `"${(p.image_url || '').replace(/"/g, '""')}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `MahinsStore_Inventory_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportCustomersCSV = () => {
    if (customers.length === 0) {
      alert('No customer records to export.')
      return
    }

    const headers = ['name', 'email', 'phone', 'total_orders_count', 'total_spent', 'current_profile_address']
    const rows = customers.map(c => [
      `"${(c.name || 'Guest').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      c.total_orders_count || 0,
      c.total_spent || 0,
      `"${(c.current_profile_address || '').replace(/"/g, '""')}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `MahinsStore_Customers_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadSampleCSV = () => {
    const headers = ['name', 'price', 'stock', 'category', 'description', 'base_shipping_fee', 'extra_shipping_fee', 'image_url']
    const sampleRows = [
      ['"Buddha Resin Statue 6-inch"', '599', '20', '"Decor"', '"Handcrafted calming resin statue"', '120', '80', '"https://images.unsplash.com/photo-1607604276583-eef5d076aa5f"'],
      ['"Ultrasonic Sensor HC-SR04"', '99', '150', '"Sensors"', '"High precision distance measurement sensor"', '60', '20', '"https://images.unsplash.com/photo-1581092160607-ee22621dd758"']
    ]

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'Sample_Bulk_Products_Template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        setTimeout(async () => {
          const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '')

          if (lines.length < 2) {
            setErrorMsg('CSV file is empty or missing data rows.')
            setLoading(false)
            return
          }

          const headers: string[] = lines[0].split(',').map((h: string) => h.trim().toLowerCase().replace(/"/g, ''))
          const parsedProducts: any[] = []

          const parseCSVLine = (line: string) => {
            const result = []
            let curVal = ''
            let inQuotes = false
            for (let i = 0; i < line.length; i++) {
              const char = line[i]
              if (char === '"') {
                inQuotes = !inQuotes
              } else if (char === ',' && !inQuotes) {
                result.push(curVal.trim())
                curVal = ''
              } else {
                curVal += char
              }
            }
            result.push(curVal.trim())
            return result
          }

          for (let i = 1; i < lines.length; i++) {
            const matches = parseCSVLine(lines[i])
            if (matches.length > 0 && matches[0]) {
              const productObj: Record<string, any> = {}
              headers.forEach((header: string, index: number) => {
                productObj[header] = matches[index] || ''
              })
              parsedProducts.push(productObj)
            }
          }

          if (parsedProducts.length === 0) {
            setErrorMsg('Could not parse any valid product rows from the file.')
            setLoading(false)
            return
          }

          const res = await fetch('/api/admin/products/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: parsedProducts })
          })

          const result = await res.json()
          if (result.success) {
            setSuccessMsg(`🎉 Successfully imported ${result.count} products into inventory!`)
            fetchAdminData()
          } else {
            setErrorMsg(`Import failed: ${result.error}`)
          }
          setLoading(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }, 50)
      } catch (err: any) {
        setErrorMsg(`Failed to parse CSV: ${err.message}`)
        setLoading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }

    reader.readAsText(file)
  }

  const categoriesList = Array.from(
    new Set(
      products
        .map(p => p.category?.trim())
        .filter(Boolean)
    )
  ).sort((a: any, b: any) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

  const filteredProducts = products.filter(p => {
    const twelveId = getTwelveDigitId(p.id)
    const matchesSearch = 
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      twelveId.includes(searchQuery)

    const matchesCategory = selectedCategoryFilter === 'ALL' || (p.category && p.category.trim().toLowerCase() === selectedCategoryFilter.toLowerCase())

    const liveStock = p.is_bundle ? calculateBundleStock(p.id) : (p.stock || 0)

    let matchesStock = true
    if (stockFilter === 'LOW') matchesStock = liveStock <= 5
    if (stockFilter === 'AVAILABLE') matchesStock = liveStock > 5
    if (stockFilter === 'OUT') matchesStock = liveStock === 0

    return matchesSearch && matchesCategory && matchesStock
  })

  // Filter Orders
  const filteredAdminOrders = orders
    .filter(o => {
      const matchesStatus = activeAdminOrderTab === 'ALL' || (o.status || 'Pending').toUpperCase() === activeAdminOrderTab.toUpperCase()
      if (!matchesStatus) return false

      const searchTarget = orderSearchQuery.toLowerCase().trim()
      let matchesSearch = true
      if (searchTarget) {
        const tracking = (o.tracking_id || '').toLowerCase()
        const customerName = (o.customer_name || '').toLowerCase()
        const customerEmail = (o.customer_email || '').toLowerCase()
        const shippingAddr = (o.shipping_address || '').toLowerCase()
        const itemsList = Array.isArray(o.items) ? o.items.map((i: any) => (i.name || '').toLowerCase()).join(' ') : ''
        
        matchesSearch = 
          tracking.includes(searchTarget) || 
          customerName.includes(searchTarget) || 
          customerEmail.includes(searchTarget) || 
          shippingAddr.includes(searchTarget) ||
          itemsList.includes(searchTarget)
      }
      if (!matchesSearch) return false

      const totalAmount = Number(o.total_amount || o.final_payable_amount || 0)
      if (minAmountFilter && totalAmount < Number(minAmountFilter)) return false
      if (maxAmountFilter && totalAmount > Number(maxAmountFilter)) return false

      return true
    })
    .sort((a, b) => {
      const amountA = Number(a.total_amount || a.final_payable_amount || 0)
      const amountB = Number(b.total_amount || b.final_payable_amount || 0)

      if (orderAmountSort === 'HIGH_TO_LOW') return amountB - amountA
      if (orderAmountSort === 'LOW_TO_HIGH') return amountA - amountB
      return 0
    })

  const allUpiOrders = orders.filter(o => {
    const payMethod = (o.payment_method || '').toLowerCase()
    return payMethod.includes('direct upi')
  })

  const upiPendingOrders = allUpiOrders.filter(o => {
    const status = (o.status || '').toLowerCase()
    return status === 'pending verification' || status === 'pending'
  })

  const filteredUpiVerifications = allUpiOrders.filter(o => {
    const status = (o.status || '').toLowerCase()
    
    if (upiStatusFilter === 'PENDING' && status !== 'pending verification' && status !== 'pending') return false
    if (upiStatusFilter === 'APPROVED' && status !== 'processing' && status !== 'shipped' && status !== 'delivered') return false
    if (upiStatusFilter === 'REJECTED' && status !== 'cancelled') return false

    const q = upiSearchQuery.toLowerCase().trim()
    if (!q) return true

    const trackingId = (o.tracking_id || '').toLowerCase()
    const customerName = (o.customer_name || '').toLowerCase()
    const customerEmail = (o.customer_email || '').toLowerCase()
    const customerId12 = getTwelveDigitId(o.user_id).toLowerCase()
    const orderValue = String(o.total_amount || o.final_payable_amount || '')
    const paymentMethodStr = (o.payment_method || '').toLowerCase()

    return (
      trackingId.includes(q) ||
      customerName.includes(q) ||
      customerEmail.includes(q) ||
      customerId12.includes(q) ||
      orderValue.includes(q) ||
      paymentMethodStr.includes(q)
    )
  })

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearchQuery.toLowerCase().trim()
    if (!q) return true
    const twelveId = getTwelveDigitId(c.id)
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.current_profile_address || '').toLowerCase().includes(q) ||
      twelveId.includes(q)
    )
  })

  const getAdminOrderCount = (status: string) => {
    if (status === 'ALL') return orders.length
    return orders.filter(o => (o.status || 'Pending').toUpperCase() === status.toUpperCase()).length
  }

  const activeAndDeliveredOrders = orders.filter(o => o.status !== 'Cancelled')
  const totalRevenue = activeAndDeliveredOrders.reduce((acc, o) => acc + Number(o.total_amount || o.final_payable_amount || 0), 0)
  const deliveredRevenue = orders.filter(o => o.status === 'Delivered').reduce((acc, o) => acc + Number(o.total_amount || o.final_payable_amount || 0), 0)
  const averageOrderValue = activeAndDeliveredOrders.length > 0 ? Math.round(totalRevenue / activeAndDeliveredOrders.length) : 0
  const lowStockProducts = products.filter(p => {
    const s = p.is_bundle ? calculateBundleStock(p.id) : (p.stock || 0)
    return s <= 5
  })

  const productSalesMap = new Map<string, { id: string; name: string; category: string; unitsSold: number; totalSales: number; currentStock: number }>()
  for (const order of activeAndDeliveredOrders) {
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const prodId = item.id || item.product_id || item.name
        const itemQty = Number(item.quantity) || 1
        const itemPrice = Number(item.price) || 0
        const itemSales = itemPrice * itemQty

        const existing = productSalesMap.get(prodId) || {
          id: prodId,
          name: item.name,
          category: item.category || 'General',
          unitsSold: 0,
          totalSales: 0,
          currentStock: products.find(p => p.id === prodId)?.stock ?? 0
        }

        existing.unitsSold += itemQty
        existing.totalSales += itemSales
        productSalesMap.set(prodId, existing)
      }
    }
  }
  const topSellingProducts = Array.from(productSalesMap.values()).sort((a, b) => b.unitsSold - a.unitsSold)

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#2B2B2B] flex flex-col justify-center items-center p-6 text-[#2B2B2B]">
        <div className="w-full max-w-md bg-[#EFE3D3] rounded-3xl shadow-2xl p-8 border border-[#8A7968]/30">
          <div className="text-center mb-8">
            <h1 className="text-xl font-black text-[#2B2B2B] leading-tight">Mahin's One-Stop One-Store</h1>
            <p className="text-xs text-[#8A7968] font-bold mt-1">Admin Security Portal</p>
          </div>

          {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-xs font-semibold border border-red-200">{errorMsg}</div>}
          {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-xl text-xs font-semibold border border-green-300">{successMsg}</div>}

          {authStep === 'credentials' && (
            <form onSubmit={handleSendEmailOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Admin Email</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Enter admin email..." 
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-3 rounded-xl text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden" 
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[#2B2B2B]">Admin Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setAuthStep('forgot_password'); setErrorMsg(''); setSuccessMsg(''); }}
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
                    placeholder="Enter password..." 
                    className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-3 rounded-xl text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden pr-16" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-3 text-xs font-bold text-[#8A7968] hover:text-[#2B2B2B] bg-[#EADBC8] border border-[#8A7968]/30 px-2 py-1 rounded cursor-pointer"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold p-3 rounded-xl text-sm shadow-md transition disabled:opacity-50 cursor-pointer btn-press">
                {loading ? 'Sending OTP to Email...' : 'Send OTP to Email →'}
              </button>
            </form>
          )}

          {authStep === 'forgot_password' && (
            <form onSubmit={handleAdminForgotPassword} className="space-y-4">
              <div className="bg-[#EADBC8]/70 p-4 rounded-2xl text-center mb-2 border border-[#8A7968]/30">
                <p className="text-xs text-[#2B2B2B] font-medium">Enter your registered admin email address to receive an instant recovery code.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Admin Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="mahinsonestoponestore@gmail.com" 
                  className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-3 rounded-xl text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden" 
                />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold p-3 rounded-xl text-sm shadow transition disabled:opacity-50 cursor-pointer btn-press">
                {loading ? 'Dispatching Recovery OTP...' : 'Send Recovery OTP to Email'}
              </button>

              <button 
                type="button" 
                onClick={() => { setAuthStep('credentials'); setErrorMsg(''); setSuccessMsg(''); }} 
                className="w-full text-xs text-[#8A7968] hover:underline mt-2 text-center block cursor-pointer"
              >
                ← Back to Password Login
              </button>
            </form>
          )}

          {authStep === 'otp' && (
            <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
              <div className="bg-[#EADBC8]/70 p-4 rounded-2xl text-center mb-4 border border-[#8A7968]/30">
                <p className="text-xs text-[#2B2B2B] font-medium">A security OTP was sent to <span className="font-bold text-[#B76E79]">{email}</span></p>
                <p className="text-[10px] text-[#8A7968] mt-1">Please check your inbox or spam folder</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Enter 6-Digit OTP Token</label>
                <input 
                  type="text" 
                  required 
                  value={otpToken} 
                  onChange={(e) => setOtpToken(e.target.value)} 
                  placeholder="Enter 6-digit code..." 
                  className="w-full border border-[#B76E79]/50 bg-[#F4EADE] p-3 rounded-xl text-center tracking-widest text-lg font-bold text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden" 
                />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-green-700 hover:bg-green-800 text-white font-bold p-3 rounded-xl text-sm shadow-md transition disabled:opacity-50 cursor-pointer btn-press">
                {loading ? 'Verifying...' : 'Verify & Enter Dashboard'}
              </button>
              
              <button 
                type="button" 
                onClick={() => { setAuthStep('credentials'); setOtpToken(''); setSuccessMsg(''); }} 
                className="w-full text-xs text-[#8A7968] hover:underline mt-2 text-center block cursor-pointer"
              >
                ← Back to Login
              </button>
            </form>
          )}

          <div className="mt-6 text-center border-t border-[#8A7968]/20 pt-4">
            <Link href="/" className="text-xs font-semibold text-[#B76E79] hover:underline">← Return to Storefront</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4EADE] pb-16 text-[#2B2B2B]">
      <header className="bg-[#EFE3D3] px-4 sm:px-8 py-5 shadow-xs mb-8 border-b border-[#8A7968]/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <h1 className="text-lg sm:text-2xl font-black text-[#2B2B2B] tracking-tight truncate">Mahin's One-Stop One-Store — Admin Dashboard</h1>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs bg-green-100 text-green-800 border border-green-200 font-bold px-3 py-1 rounded-full hidden sm:inline-block">Secure Admin Active</span>
            <Link href="/" className="text-xs sm:text-sm font-bold text-[#B76E79] hover:underline">Store</Link>
            <button 
              onClick={handleLogout} 
              className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              Logout 🔒
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4">
        {errorMsg && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-2xl border border-red-300 font-medium text-xs sm:text-sm">{errorMsg}</div>}
        {successMsg && <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-2xl border border-green-300 font-medium text-xs sm:text-sm">{successMsg}</div>}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2.5 sm:gap-3 mb-8 border-b border-[#8A7968]/20 pb-4">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 border ${
              activeTab === 'analytics' ? 'bg-[#B76E79] text-white border-[#B76E79] shadow-xs' : 'bg-[#EFE3D3] text-[#2B2B2B] border-[#8A7968]/30 hover:bg-[#EADBC8]'
            }`}
          >
            📊 Analytics & Insights
          </button>
          <button
            onClick={() => setActiveTab('upi_verifications')}
            className={`px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer relative flex items-center gap-2 border ${
              activeTab === 'upi_verifications' ? 'bg-[#B76E79] text-white border-[#B76E79] shadow-xs' : 'bg-[#EADBC8] text-[#2B2B2B] border-[#8A7968]/30 hover:bg-[#8A7968]/20'
            }`}
          >
            ⚡ UPI Verifications
            {upiPendingOrders.length > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                {upiPendingOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer border ${
              activeTab === 'orders' ? 'bg-[#B76E79] text-white border-[#B76E79] shadow-xs' : 'bg-[#EFE3D3] text-[#2B2B2B] border-[#8A7968]/30 hover:bg-[#EADBC8]'
            }`}
          >
            🛒 Customer Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer border ${
              activeTab === 'products' ? 'bg-[#B76E79] text-white border-[#B76E79] shadow-xs' : 'bg-[#EFE3D3] text-[#2B2B2B] border-[#8A7968]/30 hover:bg-[#EADBC8]'
            }`}
          >
            📦 Inventory & Kits ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 border ${
              activeTab === 'customers' ? 'bg-[#B76E79] text-white border-[#B76E79] shadow-xs' : 'bg-[#EFE3D3] text-[#2B2B2B] border-[#8A7968]/30 hover:bg-[#EADBC8]'
            }`}
          >
            👥 Customers Directory ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 border ${
              activeTab === 'coupons' ? 'bg-[#B76E79] text-white border-[#B76E79] shadow-xs' : 'bg-[#EFE3D3] text-[#2B2B2B] border-[#8A7968]/30 hover:bg-[#EADBC8]'
            }`}
          >
            🏷️ Coupons ({coupons.length})
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 border ${
              activeTab === 'banners' ? 'bg-[#B76E79] text-white border-[#B76E79] shadow-xs' : 'bg-[#EFE3D3] text-[#2B2B2B] border-[#8A7968]/30 hover:bg-[#EADBC8]'
            }`}
          >
            🖼️ Posters ({banners.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 border ${
              activeTab === 'payments' ? 'bg-[#B76E79] text-white border-[#B76E79] shadow-xs' : 'bg-[#EFE3D3] text-[#2B2B2B] border-[#8A7968]/30 hover:bg-[#EADBC8]'
            }`}
          >
            💳 Payments
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 border ${
              activeTab === 'reviews' ? 'bg-[#B76E79] text-white border-[#B76E79] shadow-xs' : 'bg-[#EFE3D3] text-[#2B2B2B] border-[#8A7968]/30 hover:bg-[#EADBC8]'
            }`}
          >
            ⭐ Reviews Moderation
          </button>
        </div>

        {/* ----------------- TAB: ANALYTICS & INSIGHTS ----------------- */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-[#EFE3D3] p-5 sm:p-6 rounded-3xl border border-[#8A7968]/30 shadow-xs">
                <span className="text-xs font-bold text-[#8A7968] uppercase tracking-wider block mb-1">Total Active Gross Revenue</span>
                <h3 className="text-2xl font-black text-[#2B2B2B]">₹{totalRevenue.toLocaleString()}</h3>
                <span className="text-[11px] text-green-700 font-bold mt-2 block">✓ Excludes cancelled orders</span>
              </div>

              <div className="bg-[#EFE3D3] p-5 sm:p-6 rounded-3xl border border-[#8A7968]/30 shadow-xs">
                <span className="text-xs font-bold text-[#8A7968] uppercase tracking-wider block mb-1">Delivered Net Revenue</span>
                <h3 className="text-2xl font-black text-green-700">₹{deliveredRevenue.toLocaleString()}</h3>
                <span className="text-[11px] text-[#8A7968] font-bold mt-2 block">{getAdminOrderCount('Delivered')} fulfilled orders</span>
              </div>

              <div className="bg-[#EFE3D3] p-5 sm:p-6 rounded-3xl border border-[#8A7968]/30 shadow-xs">
                <span className="text-xs font-bold text-[#8A7968] uppercase tracking-wider block mb-1">Average Order Value (AOV)</span>
                <h3 className="text-2xl font-black text-[#B76E79]">₹{averageOrderValue.toLocaleString()}</h3>
                <span className="text-[11px] text-[#8A7968] font-bold mt-2 block">Per active checkout</span>
              </div>

              <div className="bg-[#EFE3D3] p-5 sm:p-6 rounded-3xl border border-[#8A7968]/30 shadow-xs">
                <span className="text-xs font-bold text-[#8A7968] uppercase tracking-wider block mb-1">Total Order Volume</span>
                <h3 className="text-2xl font-black text-[#2B2B2B]">{orders.length} Orders</h3>
                <span className="text-[11px] text-[#8A7968] font-bold mt-2 block">{customers.length} total customer accounts</span>
              </div>
            </div>

            <SalesCharts orders={orders} products={products} />

            <div className="bg-[#EFE3D3] p-5 sm:p-6 rounded-3xl border border-[#8A7968]/30 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#2B2B2B] flex items-center gap-2">
                    ⚠️ Low Stock Warning Center
                    <span className="bg-red-100 text-red-800 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                      {lowStockProducts.length} Items Critical
                    </span>
                  </h3>
                  <p className="text-xs text-[#8A7968] mt-0.5">Inventory items with 5 units or less remaining in warehouse</p>
                </div>
                <button
                  onClick={() => { setActiveTab('products'); setStockFilter('LOW'); }}
                  className="text-xs font-bold text-[#B76E79] hover:underline cursor-pointer"
                >
                  Manage In Inventory →
                </button>
              </div>

              {lowStockProducts.length === 0 ? (
                <div className="bg-green-100 p-4 rounded-2xl border border-green-300 text-xs text-green-800 font-semibold">
                  ✓ All products are comfortably stocked (&gt; 5 units).
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lowStockProducts.map((p) => {
                    const currentStock = p.is_bundle ? calculateBundleStock(p.id) : (p.stock || 0)
                    return (
                      <div key={p.id} className="bg-[#F4EADE] p-3.5 rounded-2xl border border-[#8A7968]/30 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-[#2B2B2B]">{p.name || p.title}</h4>
                          <span className="text-[11px] text-[#8A7968]">{p.is_bundle ? '🎒 Lab Kit Bundle' : (p.category || 'General')}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${currentStock === 0 ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                          {currentStock === 0 ? 'OUT OF STOCK' : `${currentStock} left`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="bg-[#EFE3D3] p-5 sm:p-6 rounded-3xl border border-[#8A7968]/30 shadow-xs">
              <h3 className="text-base font-bold text-[#2B2B2B] mb-1">🏆 Top Performing Products</h3>
              <p className="text-xs text-[#8A7968] mb-6">Ranked by total quantity sold across active customer orders</p>

              {topSellingProducts.length === 0 ? (
                <p className="text-xs text-[#8A7968] italic">No order data available to generate performance leaderboard.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[#8A7968]/30 bg-[#F4EADE]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#EADBC8] border-b border-[#8A7968]/20 text-[#2B2B2B] font-bold">
                        <th className="p-3">Rank</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-center">Units Sold</th>
                        <th className="p-3 text-right">Total Revenue Generated</th>
                        <th className="p-3 text-right">Current Available Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSellingProducts.slice(0, 8).map((p, idx) => (
                        <tr key={idx} className="border-b border-[#8A7968]/15 hover:bg-[#EADBC8]/40">
                          <td className="p-3 font-bold text-[#B76E79]">#{idx + 1}</td>
                          <td className="p-3 font-bold text-[#2B2B2B]">{p.name}</td>
                          <td className="p-3 text-center font-extrabold text-[#B76E79]">{p.unitsSold} pcs</td>
                          <td className="p-3 text-right font-black text-[#2B2B2B]">₹{p.totalSales.toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded-lg font-bold text-[11px] ${p.currentStock > 5 ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                              {p.currentStock} in stock
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-[#EFE3D3] p-5 sm:p-6 rounded-3xl border border-[#8A7968]/30 shadow-xs">
              <h3 className="text-base font-bold text-[#2B2B2B] mb-4">📦 Order Status Distribution</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-[#EADBC8]/70 p-4 rounded-2xl border border-[#8A7968]/30 text-center">
                  <span className="text-[11px] font-bold text-[#8A7968] uppercase block">Pending</span>
                  <span className="text-xl font-black text-[#2B2B2B] mt-1 block">{getAdminOrderCount('Pending')}</span>
                </div>
                <div className="bg-[#EADBC8]/70 p-4 rounded-2xl border border-[#8A7968]/30 text-center">
                  <span className="text-[11px] font-bold text-[#8A7968] uppercase block">Processing</span>
                  <span className="text-xl font-black text-[#2B2B2B] mt-1 block">{getAdminOrderCount('Processing')}</span>
                </div>
                <div className="bg-[#EADBC8]/70 p-4 rounded-2xl border border-[#8A7968]/30 text-center">
                  <span className="text-[11px] font-bold text-[#8A7968] uppercase block">Shipped</span>
                  <span className="text-xl font-black text-[#2B2B2B] mt-1 block">{getAdminOrderCount('Shipped')}</span>
                </div>
                <div className="bg-[#EADBC8]/70 p-4 rounded-2xl border border-[#8A7968]/30 text-center">
                  <span className="text-[11px] font-bold text-[#8A7968] uppercase block">Delivered</span>
                  <span className="text-xl font-black text-green-700 mt-1 block">{getAdminOrderCount('Delivered')}</span>
                </div>
                <div className="bg-[#EADBC8]/70 p-4 rounded-2xl border border-[#8A7968]/30 text-center">
                  <span className="text-[11px] font-bold text-[#8A7968] uppercase block">Cancelled</span>
                  <span className="text-xl font-black text-red-700 mt-1 block">{getAdminOrderCount('Cancelled')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB: UPI VERIFICATIONS ----------------- */}
        {activeTab === 'upi_verifications' && (
          <div className="bg-[#EFE3D3] p-5 sm:p-6 rounded-3xl shadow-xs border border-[#8A7968]/30 space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-[#8A7968]/20 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#2B2B2B]">⚡ Direct UPI / QR Payment Verification Center</h2>
                <p className="text-xs text-[#8A7968]">Review, verify, or reject direct QR/UPI transfers safely</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
                <input
                  type="text"
                  value={upiSearchQuery}
                  onChange={(e) => setUpiSearchQuery(e.target.value)}
                  placeholder="🔍 Search name, tracking ID, amount, UTR..."
                  className="border border-[#8A7968]/40 p-2.5 rounded-xl text-xs w-full sm:w-80 text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden bg-[#F4EADE] placeholder:text-[#8A7968]/70"
                />

                <select
                  value={upiStatusFilter}
                  onChange={(e) => setUpiStatusFilter(e.target.value)}
                  className="border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden"
                >
                  <option value="ALL">All Statuses ({allUpiOrders.length})</option>
                  <option value="PENDING">Pending Only ({upiPendingOrders.length})</option>
                  <option value="APPROVED">Approved Only</option>
                  <option value="REJECTED">Rejected / Cancelled</option>
                </select>

                {(upiSearchQuery || upiStatusFilter !== 'ALL') && (
                  <button
                    onClick={() => { setUpiSearchQuery(''); setUpiStatusFilter('ALL'); }}
                    className="text-xs text-red-600 hover:underline font-bold px-3 py-2 bg-red-50 border border-red-200 rounded-xl cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {filteredUpiVerifications.length === 0 ? (
              <div className="py-16 text-center bg-[#F4EADE] rounded-2xl border border-[#8A7968]/30">
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-sm font-bold text-[#2B2B2B]">No UPI payment records match your search criteria.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredUpiVerifications.map((o) => {
                  const twelveCustId = getTwelveDigitId(o.user_id)
                  const orderDate = o.created_at ? new Date(o.created_at).toLocaleString() : 'N/A'
                  const statusLower = (o.status || '').toLowerCase()
                  const isPending = statusLower === 'pending verification' || statusLower === 'pending'
                  const isCancelled = statusLower === 'cancelled'
                  const cleanUtr = extractUtrNumber(o.payment_method)

                  return (
                    <div key={o.id} className="bg-[#F4EADE] rounded-3xl border border-[#8A7968]/30 p-5 sm:p-6 shadow-2xs hover:border-[#B76E79] transition space-y-4">
                      <div className="flex flex-wrap justify-between items-center border-b border-[#8A7968]/20 pb-4 gap-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-[10px] font-extrabold text-[#8A7968] uppercase tracking-wider block">Tracking ID</span>
                            <span className="font-mono text-base font-black text-[#2B2B2B]">{o.tracking_id}</span>
                          </div>
                          <span className="text-[#8A7968]/50">•</span>
                          <span className="text-xs text-[#8A7968] font-semibold">🕒 {orderDate}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[10px] font-extrabold text-[#8A7968] uppercase tracking-wider block">Total Amount</span>
                            <span className="text-xl font-black text-[#2B2B2B]">₹{o.total_amount || o.final_payable_amount}</span>
                          </div>
                          <div className="text-right">
                            <span className={`px-3.5 py-1.5 rounded-full font-black text-[11px] uppercase inline-block border ${
                              isPending ? 'bg-amber-100 text-amber-900 border-amber-300' :
                              isCancelled ? 'bg-red-100 text-red-900 border-red-300' : 'bg-green-100 text-green-900 border-green-300'
                            }`}>
                              {o.status}
                            </span>
                            {o.cancellation_reason && (
                              <span className="text-[11px] text-red-600 font-semibold block mt-1 max-w-xs text-right leading-tight">
                                {o.cancellation_reason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                        <div className="bg-[#EFE3D3] p-4 rounded-2xl border border-[#8A7968]/20 space-y-1.5">
                          <span className="text-[10px] font-extrabold text-[#B76E79] uppercase tracking-wider block">Customer Details</span>
                          <div className="font-extrabold text-[#2B2B2B] text-sm">{o.customer_name}</div>
                          <div className="text-[#8A7968] font-medium">{o.customer_email}</div>
                          <span className="inline-block mt-1 text-[10px] font-mono text-[#2B2B2B] font-bold bg-[#EADBC8] px-2.5 py-1 rounded-lg border border-[#8A7968]/30">
                            ID: {twelveCustId}
                          </span>
                        </div>

                        <div className="bg-[#EFE3D3] p-4 rounded-2xl border border-[#8A7968]/20 space-y-1.5">
                          <span className="text-[10px] font-extrabold text-[#B76E79] uppercase tracking-wider block">UTR Number</span>
                          <span className="inline-block bg-[#F4EADE] text-[#2B2B2B] font-mono font-black px-3 py-2 rounded-xl border border-[#8A7968]/30 text-xs shadow-2xs">
                            {cleanUtr}
                          </span>
                        </div>

                        <div className="bg-[#EFE3D3] p-4 rounded-2xl border border-[#8A7968]/20 space-y-2">
                          <span className="text-[10px] font-extrabold text-[#B76E79] uppercase tracking-wider block">Items Ordered</span>
                          {Array.isArray(o.items) && o.items.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                              {o.items.map((item: any, idx: number) => {
                                const itemImg = item.image_url ? item.image_url.split(',')[0].trim() : 'https://via.placeholder.com/40'
                                const twelveDigitId = getTwelveDigitId(item.id || item.product_id || '')
                                return (
                                  <div key={idx} className="flex items-center gap-2.5 bg-[#F4EADE] p-2 rounded-xl border border-[#8A7968]/20 shadow-2xs">
                                    <div 
                                      onClick={async () => {
                                        const productId = item.id || item.product_id
                                        if (productId) {
                                          const { data } = await supabase.from('products').select('image_url').eq('id', productId).single()
                                          if (data && data.image_url) {
                                            const allImgs = data.image_url.split(',').map((s: string) => s.trim()).filter(Boolean)
                                            setActiveOrderGalleryImages(allImgs)
                                            setActiveGalleryIndex(0)
                                            return
                                          }
                                        }
                                        setActiveOrderGalleryImages([itemImg])
                                        setActiveGalleryIndex(0)
                                      }}
                                      className="relative group flex-shrink-0 cursor-pointer"
                                      title="Click to view all product images"
                                    >
                                      <img src={itemImg} alt="" className="w-9 h-9 object-cover rounded-lg border border-[#8A7968]/30 bg-white hover:border-[#B76E79] transition" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-[#2B2B2B] truncate text-xs">{item.name}</div>
                                      <div className="text-[10px] text-[#B76E79] font-bold">Qty: {item.quantity} • ID: {twelveDigitId}</div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <span className="text-[#8A7968] italic">No items listed</span>
                          )}
                        </div>

                        <div className="bg-[#EFE3D3] p-4 rounded-2xl border border-[#8A7968]/20 space-y-2">
                          <span className="text-[10px] font-extrabold text-[#B76E79] uppercase tracking-wider block">Shipping Address</span>
                          <div className="bg-[#F4EADE] p-3 rounded-xl border border-[#8A7968]/30 leading-relaxed max-h-32 overflow-y-auto text-[11px] text-[#2B2B2B] shadow-2xs">
                            {o.shipping_address || 'No address provided'}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(o.shipping_address || '')
                              alert('Shipping address copied to clipboard!')
                            }}
                            className="bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] text-[11px] font-bold px-3 py-1.5 rounded-xl transition border border-[#8A7968]/30 cursor-pointer block w-full text-center"
                          >
                            📋 Copy Full Address
                          </button>
                        </div>
                      </div>

                      {isPending && (
                        <div className="flex justify-end gap-3 pt-4 border-t border-[#8A7968]/20">
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'Cancelled')}
                            className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-6 py-3 rounded-xl transition border border-red-200 cursor-pointer"
                          >
                            ✕ Reject & Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'Processing')}
                            className="bg-green-700 hover:bg-green-800 text-white font-extrabold text-xs px-8 py-3 rounded-xl shadow-xs transition cursor-pointer btn-press"
                          >
                            ✓ Verify & Approve Payment
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB: CUSTOMER ORDERS ----------------- */}
        {activeTab === 'orders' && (
          <div className="bg-[#EFE3D3] p-5 sm:p-6 rounded-3xl shadow-xs border border-[#8A7968]/30 space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-[#8A7968]/20 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#2B2B2B]">Customer Orders ({orders.length})</h2>
                <p className="text-xs text-[#8A7968]">Showing {filteredAdminOrders.length} filtered results</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="🔍 Search Tracking ID, Name, Email, Items..."
                  className="border border-[#8A7968]/40 p-2.5 rounded-xl text-xs w-full sm:w-64 text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden bg-[#F4EADE] placeholder:text-[#8A7968]/70"
                />

                <select
                  value={orderAmountSort}
                  onChange={(e: any) => setOrderAmountSort(e.target.value)}
                  className="border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden"
                >
                  <option value="DEFAULT">Sort Amount: Default</option>
                  <option value="HIGH_TO_LOW">Amount: High to Low (₹₹₹)</option>
                  <option value="LOW_TO_HIGH">Amount: Low to High (₹)</option>
                </select>

                <div className="flex items-center gap-1.5 bg-[#F4EADE] p-1 rounded-xl border border-[#8A7968]/40">
                  <input
                    type="number"
                    value={minAmountFilter}
                    onChange={(e) => setMinAmountFilter(e.target.value)}
                    placeholder="Min ₹"
                    className="border border-[#8A7968]/30 p-1.5 rounded-lg text-xs w-20 text-[#2B2B2B] bg-[#EADBC8]/40 focus:border-[#B76E79] focus:outline-hidden"
                  />
                  <span className="text-[#8A7968] text-xs font-bold">-</span>
                  <input
                    type="number"
                    value={maxAmountFilter}
                    onChange={(e) => setMaxAmountFilter(e.target.value)}
                    placeholder="Max ₹"
                    className="border border-[#8A7968]/30 p-1.5 rounded-lg text-xs w-20 text-[#2B2B2B] bg-[#EADBC8]/40 focus:border-[#B76E79] focus:outline-hidden"
                  />
                </div>

                {(orderSearchQuery || orderAmountSort !== 'DEFAULT' || minAmountFilter !== '' || maxAmountFilter !== '') && (
                  <button
                    onClick={() => {
                      setOrderSearchQuery('')
                      setOrderAmountSort('DEFAULT')
                      setMinAmountFilter('')
                      setMaxAmountFilter('')
                    }}
                    className="text-xs text-red-600 hover:underline font-bold px-3 py-2 bg-red-50 border border-red-200 rounded-xl cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 border-b border-[#8A7968]/20 pb-4">
              {['ALL', 'PENDING VERIFICATION', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => {
                const count = getAdminOrderCount(status)
                const isCurrent = activeAdminOrderTab === status
                return (
                  <button
                    key={status}
                    onClick={() => setActiveAdminOrderTab(status)}
                    className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer border ${
                      isCurrent
                        ? 'bg-[#B76E79] text-white border-[#B76E79] shadow-xs'
                        : 'bg-[#F4EADE] text-[#2B2B2B] border-[#8A7968]/30 hover:bg-[#EADBC8]'
                    }`}
                  >
                    {status} <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isCurrent ? 'bg-[#9E5B65] text-white' : 'bg-[#EADBC8] text-[#2B2B2B]'}`}>{count}</span>
                  </button>
                )
              })}
            </div>

            {loading ? (
              <p className="text-[#8A7968] font-bold">Loading orders...</p>
            ) : filteredAdminOrders.length === 0 ? (
              <div className="py-12 text-center text-[#8A7968]">
                <p className="text-sm font-semibold">No orders match your filter criteria.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredAdminOrders.map((o) => {
                  const orderDate = o.created_at ? new Date(o.created_at).toLocaleString() : 'N/A'
                  const statusLower = (o.status || '').toLowerCase()
                  const isPending = statusLower === 'pending verification' || statusLower === 'pending'
                  const isCancelled = statusLower === 'cancelled'
                  const isUpiVerifiedOrPaid = (o.payment_method || '').includes('Paid') || (o.payment_method || '').includes('UTR')
                  const dynamicPaymentStatus = isUpiVerifiedOrPaid ? 'Paid & Verified' : (o.payment_status || 'Done')

                  return (
                    <div key={o.id} className="bg-[#F4EADE] rounded-3xl border border-[#8A7968]/30 p-5 sm:p-6 shadow-2xs hover:border-[#B76E79] transition space-y-4">
                      <div className="flex flex-wrap justify-between items-center border-b border-[#8A7968]/20 pb-4 gap-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-[10px] font-extrabold text-[#8A7968] uppercase tracking-wider block mb-0.5">Tracking ID</span>
                            <span className="font-mono text-base font-black text-[#2B2B2B]">{o.tracking_id || 'N/A'}</span>
                          </div>
                          <span className="text-[#8A7968]/50">•</span>
                          <span className="text-xs text-[#8A7968] font-semibold">🕒 {orderDate}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[10px] font-extrabold text-[#8A7968] uppercase tracking-wider block">Total Amount</span>
                            <span className="text-xl font-black text-[#2B2B2B]">₹{o.total_amount || o.final_payable_amount}</span>
                          </div>
                          <div className="text-right">
                            <span className={`px-3.5 py-1.5 rounded-full font-black text-[11px] uppercase inline-block border ${
                              isPending ? 'bg-amber-100 text-amber-900 border-amber-300' :
                              isCancelled ? 'bg-red-100 text-red-900 border-amber-300' : 'bg-green-100 text-green-900 border-green-300'
                            }`}>
                              {o.status || 'Pending'}
                            </span>
                            {o.cancellation_reason && (
                              <span className="text-[11px] text-red-600 font-semibold block mt-1 max-w-xs text-right leading-tight">
                                {o.cancellation_reason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                        <div className="bg-[#EFE3D3] p-4 rounded-2xl border border-[#8A7968]/20 space-y-1">
                          <span className="text-[10px] font-extrabold text-[#B76E79] uppercase tracking-wider block">Customer Details</span>
                          <div className="font-extrabold text-[#2B2B2B] text-sm">{o.customer_name || 'Guest'}</div>
                          <div className="text-[#8A7968] font-medium">{o.customer_email || 'No email available'}</div>
                        </div>

                        <div className="bg-[#EFE3D3] p-4 rounded-2xl border border-[#8A7968]/20 space-y-1.5">
                          <span className="text-[10px] font-extrabold text-[#B76E79] uppercase tracking-wider block">Payment Details</span>
                          <span className="inline-block bg-[#F4EADE] text-[#2B2B2B] font-mono font-bold px-3 py-1.5 rounded-xl border border-[#8A7968]/30 text-xs shadow-2xs">
                            {o.payment_method || 'Online'}
                          </span>
                        </div>

                        <div className="bg-[#EFE3D3] p-4 rounded-2xl border border-[#8A7968]/20 space-y-2">
                          <span className="text-[10px] font-extrabold text-[#B76E79] uppercase tracking-wider block">Items Ordered</span>
                          {Array.isArray(o.items) && o.items.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                              {o.items.map((item: any, idx: number) => {
                                const itemImg = item.image_url ? item.image_url.split(',')[0].trim() : 'https://via.placeholder.com/40'
                                const twelveDigitId = getTwelveDigitId(item.id || item.product_id || '')
                                return (
                                  <div key={idx} className="flex items-center gap-2.5 bg-[#F4EADE] p-2 rounded-xl border border-[#8A7968]/20 shadow-2xs">
                                    <div 
                                      onClick={async () => {
                                        const productId = item.id || item.product_id
                                        if (productId) {
                                          const { data } = await supabase.from('products').select('image_url').eq('id', productId).single()
                                          if (data && data.image_url) {
                                            const allImgs = data.image_url.split(',').map((s: string) => s.trim()).filter(Boolean)
                                            setActiveOrderGalleryImages(allImgs)
                                            setActiveGalleryIndex(0)
                                            return
                                          }
                                        }
                                        setActiveOrderGalleryImages([itemImg])
                                        setActiveGalleryIndex(0)
                                      }}
                                      className="relative group flex-shrink-0 cursor-pointer"
                                      title="Click to view all product images"
                                    >
                                      <img src={itemImg} alt="" className="w-9 h-9 object-cover rounded-lg border border-[#8A7968]/30 bg-white hover:border-[#B76E79] transition" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-[#2B2B2B] truncate text-xs">{item.name}</div>
                                      <div className="text-[10px] text-[#B76E79] font-bold">Qty: {item.quantity} • ID: {twelveDigitId}</div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <span className="text-[#8A7968] italic">No items data</span>
                          )}
                        </div>

                        <div className="bg-[#EFE3D3] p-4 rounded-2xl border border-[#8A7968]/20 space-y-2">
                          <span className="text-[10px] font-extrabold text-[#B76E79] uppercase tracking-wider block">Shipping Address</span>
                          <div className="bg-[#F4EADE] p-3 rounded-xl border border-[#8A7968]/30 leading-relaxed max-h-32 overflow-y-auto text-[11px] text-[#2B2B2B] shadow-2xs">
                            {o.shipping_address || 'No address provided'}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(o.shipping_address || '')
                              alert('Shipping address copied to clipboard!')
                            }}
                            className="bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] text-[11px] font-bold px-3 py-1.5 rounded-xl transition border border-[#8A7968]/30 cursor-pointer block w-full text-center"
                          >
                            📋 Copy Full Address
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-[#8A7968]/20">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#8A7968]">Update Status:</span>
                          <select
                            value={o.status || 'Pending'}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="border border-[#8A7968]/40 p-2 rounded-xl text-xs font-bold bg-[#EFE3D3] text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden shadow-2xs cursor-pointer"
                          >
                            <option value="PENDING VERIFICATION">PENDING VERIFICATION</option>
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActivePrintOrder({ order: o, type: 'INVOICE' })}
                            className="bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] text-xs font-bold px-3.5 py-2.5 rounded-xl border border-[#8A7968]/30 transition cursor-pointer"
                          >
                            📄 Invoice
                          </button>
                          <button
                            onClick={() => setActivePrintOrder({ order: o, type: 'PACKING_SLIP' })}
                            className="bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] text-xs font-bold px-3.5 py-2.5 rounded-xl border border-[#8A7968]/30 transition cursor-pointer"
                          >
                            🏷️ Packing Slip
                          </button>
                          <a
                            href={`https://wa.me/${(o.customer_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hello ${o.customer_name || 'Customer'},\n\nThank you for shopping at Mahin's One-Stop One-Store!\n\nOrder Status: ${o.status || 'Pending'}\nTracking ID: ${o.tracking_id}\nPayment Status: ${dynamicPaymentStatus}\nPayment Method: ${o.payment_method || 'Online/UPI'}\n\nItemized Order Summary:\n${
                                Array.isArray(o.items) 
                                  ? o.items.map((i: any) => `- ${i.name}\n  Qty: ${i.quantity || 1} x Rs.${i.price || 0} = Rs.${(i.quantity || 1) * (i.price || 0)}`).join('\n\n') 
                                  : '- Order Item'
                              }\n\n----------------\nTotal Payable Amount: Rs.${o.total_amount || o.final_payable_amount}\n----------------\n\nTrack Your Order Here:\nhttps://mahinsonestoponestore.in/track?id=${o.tracking_id}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 btn-press"
                          >
                            💬 WhatsApp Update
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 1: INVENTORY MANAGEMENT ----------------- */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-[#EFE3D3] p-5 rounded-3xl border border-[#8A7968]/30 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-sm font-black text-[#2B2B2B] flex items-center gap-2">
                  📁 Bulk Inventory Management (CSV / Excel)
                </h3>
                <p className="text-xs text-[#8A7968] mt-0.5">
                  Import dozens of electronics/robotics components at once or export full warehouse records
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                <button type="button" onClick={handleDownloadSampleCSV} className="bg-[#F4EADE] hover:bg-[#EADBC8] text-[#2B2B2B] text-xs font-bold px-3 py-2 rounded-xl border border-[#8A7968]/30 transition cursor-pointer">📝 Sample Template</button>
                <button type="button" onClick={handleExportCSV} className="bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] text-xs font-bold px-3.5 py-2 rounded-xl border border-[#8A7968]/30 transition cursor-pointer">📤 Export Inventory CSV</button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-[#B76E79] hover:bg-[#9E5B65] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer btn-press">📥 Upload Bulk CSV</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
              {/* Left Column: Add Product Form (4 of 12 columns) */}
              <div className="lg:col-span-4 bg-[#EFE3D3] p-5 sm:p-6 rounded-3xl border border-[#8A7968]/30 shadow-xs h-fit">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#2B2B2B]">{isBundle ? '🎒 Create Lab Kit' : 'Add Single Product'}</h2>
                  <label className="flex items-center gap-1.5 cursor-pointer bg-[#F4EADE] px-2.5 py-1 rounded-xl border border-[#8A7968]/30">
                    <input 
                      type="checkbox" 
                      checked={isBundle} 
                      onChange={(e) => setIsBundle(e.target.checked)} 
                      className="accent-[#B76E79]"
                    />
                    <span className="text-[11px] font-black text-[#B76E79]">Kit / Bundle</span>
                  </label>
                </div>

                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2B2B2B] mb-1">{isBundle ? 'Kit Name *' : 'Product Name *'}</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder={isBundle ? "e.g. Starter Robotics Lab Kit" : "e.g. Arduino Uno R3"} className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-[#2B2B2B] mb-1">{isBundle ? 'Kit Price (₹) *' : 'Price (₹) *'}</label>
                      <input type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="599" className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2B2B2B] mb-1">
                        {isBundle ? 'Calculated Stock' : 'Stock *'}
                      </label>
                      {isBundle ? (
                        <div className="w-full border border-[#8A7968]/30 bg-[#EADBC8]/70 p-2.5 rounded-xl text-xs text-[#2B2B2B] font-extrabold flex items-center justify-between">
                          <span>{calculateBundleStock('', kitComponents)} kits</span>
                          <span className="text-[10px] text-[#8A7968]">Live</span>
                        </div>
                      ) : (
                        <input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} placeholder="50" className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden font-bold" />
                      )}
                    </div>
                  </div>

                  {/* Kit Recipe Component Manager */}
                  {isBundle && (
                    <div className="bg-[#F4EADE] p-3 rounded-2xl border border-[#8A7968]/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-[#2B2B2B] uppercase tracking-wide">
                          Kit Recipe ({kitComponents.length} parts)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddKitComponent(false)}
                          className="text-[10px] bg-[#B76E79] text-white px-2 py-1 rounded-lg font-bold hover:bg-[#9E5B65] cursor-pointer"
                        >
                          + Add Part
                        </button>
                      </div>

                      {kitComponents.length === 0 ? (
                        <p className="text-[11px] text-[#8A7968] italic">Click "+ Add Part" to select components included in this kit.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {kitComponents.map((comp, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-[#EFE3D3] p-2 rounded-xl border border-[#8A7968]/20">
                              <select
                                value={comp.component_id}
                                onChange={(e) => handleUpdateKitComponent(idx, 'component_id', e.target.value, false)}
                                className="w-full text-xs bg-[#F4EADE] p-1.5 rounded-lg border border-[#8A7968]/30 text-[#2B2B2B] font-medium focus:outline-hidden"
                              >
                                {products.filter(p => !p.is_bundle).map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.stock} in warehouse)
                                  </option>
                                ))}
                              </select>
                              <input 
                                type="number" 
                                min="1" 
                                value={comp.quantity} 
                                onChange={(e) => handleUpdateKitComponent(idx, 'quantity', parseInt(e.target.value) || 1, false)} 
                                className="w-14 text-center text-xs font-bold bg-[#F4EADE] p-1.5 rounded-lg border border-[#8A7968]/30"
                                title="Quantity in 1 kit"
                              />
                              <button 
                                type="button" 
                                onClick={() => handleRemoveKitComponent(idx, false)} 
                                className="text-red-600 font-bold px-2 py-1 rounded-lg hover:bg-red-100 text-xs cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Per-Item Shipping Controls */}
                  <div className="grid grid-cols-2 gap-2 bg-[#F4EADE] p-2.5 rounded-2xl border border-[#8A7968]/30">
                    <div>
                      <label className="block text-[11px] font-bold text-[#2B2B2B] mb-1" title="Delivery charge when ordering 1 unit">
                        Base Shipping (₹) [1st unit]
                      </label>
                      <input 
                        type="number" 
                        required 
                        value={baseShippingFee} 
                        onChange={(e) => setBaseShippingFee(e.target.value)} 
                        placeholder="120" 
                        className="w-full border border-[#8A7968]/40 bg-[#EFE3D3] p-2 rounded-xl text-xs text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#2B2B2B] mb-1" title="Additional charge for each extra unit (e.g. +80 for 2nd unit)">
                        Extra Unit (+₹) [each addl.]
                      </label>
                      <input 
                        type="number" 
                        required 
                        value={extraShippingFee} 
                        onChange={(e) => setExtraShippingFee(e.target.value)} 
                        placeholder="80" 
                        className="w-full border border-[#8A7968]/40 bg-[#EFE3D3] p-2 rounded-xl text-xs text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Category (Select existing or type new)</label>
                    <input type="text" list="existing-categories" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Microcontrollers, Sensor" className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden" />
                    <datalist id="existing-categories">
                      {categoriesList.map((cat: any, idx: number) => <option key={idx} value={cat} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Product Details / Description</label>
                    <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter full specifications..." className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2.5 rounded-xl text-xs text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Product Image URLs</label>
                    {imageInputs.map((url, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input type="url" value={url} onChange={(e) => handleImageInputChange(index, e.target.value)} placeholder="https://example.com/image.jpg" className="w-full border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden" />
                        {imageInputs.length > 1 && (
                          <button type="button" onClick={() => handleRemoveImageInput(index)} className="bg-red-50 border border-red-200 text-red-600 px-2.5 py-1 rounded-xl text-xs font-bold hover:bg-red-100 cursor-pointer">✕</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={handleAddImageInput} className="mt-1 bg-[#EADBC8] text-[#2B2B2B] hover:bg-[#8A7968]/30 font-bold text-xs px-3 py-2 rounded-xl transition w-full border border-dashed border-[#8A7968]/50 cursor-pointer">+ Add Another Image URL</button>
                  </div>

                  <button type="submit" className="w-full bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold p-3 rounded-xl text-xs sm:text-sm shadow-xs transition cursor-pointer btn-press">
                    {isBundle ? 'Create Lab Kit 🎒' : 'Add Product'}
                  </button>
                </form>
              </div>

              {/* Right Column: Store Inventory Table (8 of 12 columns) */}
              <div className="lg:col-span-8 bg-[#EFE3D3] p-4 sm:p-6 rounded-3xl border border-[#8A7968]/30 shadow-xs flex flex-col min-w-0">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-5 gap-3 border-b border-[#8A7968]/20 pb-4">
                  <h2 className="text-lg font-bold text-[#2B2B2B]">Store Inventory ({filteredProducts.length})</h2>
                  
                  <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name, ID, category..."
                      className="border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs w-full sm:w-44 text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden"
                    />

                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden"
                    >
                      <option value="ALL">All Categories</option>
                      {categoriesList.map((cat: any, i) => (
                        <option key={i} value={cat}>{cat}</option>
                      ))}
                    </select>

                    <select
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value)}
                      className="border border-[#8A7968]/40 bg-[#F4EADE] p-2 rounded-xl text-xs text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden"
                    >
                      <option value="ALL">All Stock</option>
                      <option value="AVAILABLE">In Stock (&gt;5)</option>
                      <option value="LOW">Low Stock (≤5)</option>
                      <option value="OUT">Out of Stock (0)</option>
                    </select>

                    {(searchQuery || selectedCategoryFilter !== 'ALL' || stockFilter !== 'ALL') && (
                      <button
                        onClick={() => { setSearchQuery(''); setSelectedCategoryFilter('ALL'); setStockFilter('ALL'); }}
                        className="text-xs text-red-600 hover:underline font-bold px-2 py-1.5 bg-red-50 border border-red-200 rounded-xl cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <p className="text-[#8A7968] font-bold">Loading inventory...</p>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-[#8A7968]">No products match your search or filter criteria.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[#8A7968]/30 bg-[#F4EADE] w-full">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#8A7968]/20 bg-[#EADBC8] text-[#2B2B2B] text-xs font-bold">
                          <th className="px-3 py-3 min-w-[200px]">Product / Kit</th>
                          <th className="px-3 py-3 whitespace-nowrap">Price</th>
                          <th className="px-3 py-3 whitespace-nowrap">Shipping</th>
                          <th className="px-3 py-3 whitespace-nowrap">Stock</th>
                          <th className="px-3 py-3 whitespace-nowrap">Timestamps</th>
                          <th className="px-3 py-3 text-center sticky right-0 bg-[#EADBC8] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.08)] whitespace-nowrap min-w-[140px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((p) => {
                          const firstImage = p.image_url ? p.image_url.split(',')[0].trim() : 'https://via.placeholder.com/50'
                          const addedDate = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'
                          const updatedDate = p.updated_at ? new Date(p.updated_at).toLocaleDateString() : null
                          const twelveDigitId = getTwelveDigitId(p.id)
                          const liveStock = p.is_bundle ? calculateBundleStock(p.id) : (p.stock || 0)
                          const recipeItems = bundleMap[p.id] || []

                          return (
                            <tr key={p.id} className="border-b border-[#8A7968]/15 hover:bg-[#EADBC8]/40 align-middle">
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <img src={firstImage} alt="" className="h-9 w-9 object-cover rounded-lg border border-[#8A7968]/30 bg-white shrink-0" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <button onClick={() => openCustomerPreview(p)} className="font-bold text-[#B76E79] hover:underline text-left block truncate max-w-[170px] cursor-pointer" title={p.name || p.title}>
                                        {p.name || p.title || 'Unnamed'}
                                      </button>
                                      {p.is_bundle && (
                                        <span className="bg-[#B76E79] text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                          🎒 KIT ({recipeItems.length})
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-[#8A7968] font-mono block">ID: {twelveDigitId}</span>
                                    <span className="text-[10px] text-[#8A7968]/80 block truncate max-w-[170px]">{p.category || 'General'}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="px-3 py-2.5 font-extrabold text-[#2B2B2B] whitespace-nowrap">₹{p.price}</td>
                              
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <div className="text-[11px] font-bold text-[#2B2B2B]">
                                  Base: <span className="text-[#B76E79]">₹{p.base_shipping_fee ?? 120}</span>
                                </div>
                                <div className="text-[10px] text-[#8A7968]">
                                  +₹{p.extra_shipping_fee ?? 80}/extra
                                </div>
                              </td>

                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <button
                                  onClick={() => openStockAuditModal(p)}
                                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition shadow-2xs cursor-pointer hover:underline border ${
                                    liveStock > 5 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                                  }`}
                                  title="Click to view customer order & audit logs"
                                >
                                  {liveStock} {p.is_bundle ? 'kits 🎒' : 'left 📊'}
                                </button>
                              </td>

                              <td className="px-3 py-2.5 text-[10px] text-[#8A7968] whitespace-nowrap">
                                <div>Added: {addedDate}</div>
                                {updatedDate && <div className="text-[#B76E79]">Edit: {updatedDate}</div>}
                              </td>

                              <td className="px-3 py-2.5 text-center sticky right-0 bg-[#F4EADE] shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.08)] whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button onClick={() => openCustomerPreview(p)} className="text-green-800 hover:bg-green-100 font-bold text-[11px] bg-green-50 border border-green-200 px-2 py-1 rounded-lg cursor-pointer">
                                    View
                                  </button>
                                  <button onClick={() => openEditModal(p)} className="text-[#B76E79] hover:bg-[#B76E79]/20 font-bold text-[11px] bg-[#B76E79]/15 border border-[#B76E79]/30 px-2 py-1 rounded-lg cursor-pointer">
                                    Edit ✏️
                                  </button>
                                  <button onClick={() => handleDeleteProduct(p.id)} className="text-red-700 hover:bg-red-100 font-bold text-[11px] bg-red-50 border border-red-200 px-2 py-1 rounded-lg cursor-pointer">
                                    Delete ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB: CUSTOMERS DIRECTORY ----------------- */}
        {activeTab === 'customers' && (
          <div className="bg-[#EFE3D3] p-5 sm:p-6 rounded-3xl shadow-xs border border-[#8A7968]/30 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#8A7968]/20 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#2B2B2B]">Customers Directory ({customers.length})</h2>
                <p className="text-xs text-[#8A7968]">View customer lifetime orders, total spend, and contact records</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="🔍 Search name, email, phone, ID..."
                  className="border border-[#8A7968]/40 p-2.5 rounded-xl text-xs w-full sm:w-64 text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden bg-[#F4EADE] placeholder:text-[#8A7968]/70"
                />
                <button
                  type="button"
                  onClick={handleExportCustomersCSV}
                  className="bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] text-xs font-bold px-3.5 py-2.5 rounded-xl border border-[#8A7968]/30 transition cursor-pointer whitespace-nowrap"
                >
                  📤 Export Customers
                </button>
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <p className="text-xs text-[#8A7968] italic py-12 text-center">No customer records matching your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map((cust) => {
                  const cust12 = getTwelveDigitId(cust.id)
                  return (
                    <div key={cust.id} className="bg-[#F4EADE] p-5 rounded-3xl border border-[#8A7968]/30 shadow-2xs space-y-3 hover:border-[#B76E79] transition">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-[#2B2B2B]">{cust.name || 'Guest User'}</h4>
                          <span className="text-[10px] font-mono text-[#2B2B2B] bg-[#EADBC8] px-2 py-0.5 rounded-lg border border-[#8A7968]/30 block mt-0.5">
                            ID: {cust12}
                          </span>
                        </div>
                        <span className="bg-[#EADBC8] text-[#B76E79] text-xs font-extrabold px-2.5 py-1 rounded-xl border border-[#8A7968]/30">
                          ₹{cust.total_spent || 0}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-xs text-[#8A7968]">
                        <div>✉️ {cust.email || 'No email registered'}</div>
                        <div>📞 {cust.phone || 'No phone registered'}</div>
                        <div>📦 {cust.total_orders_count || 0} total orders</div>
                      </div>

                      <div className="pt-2 border-t border-[#8A7968]/20 flex justify-end">
                        <button
                          onClick={() => setViewingCustomer(cust)}
                          className="bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer btn-press"
                        >
                          View Full Profile & Orders →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB: BANNERS & POSTERS MANAGEMENT ----------------- */}
        {activeTab === 'banners' && (
          <div className="bg-[#EFE3D3] p-5 sm:p-8 rounded-3xl shadow-xs border border-[#8A7968]/30 space-y-6">
            <div className="border-b border-[#8A7968]/20 pb-4">
              <h2 className="text-xl font-black text-[#2B2B2B]">🖼️ Store Promotional Posters & Banners</h2>
              <p className="text-xs text-[#8A7968] mt-1">Upload store posters or exclusive targeted banners for specific customers.</p>
            </div>

            <form onSubmit={handleCreateBanner} className="bg-[#F4EADE] p-5 sm:p-6 rounded-3xl border border-[#8A7968]/30 space-y-4">
              <h3 className="text-xs font-bold text-[#B76E79] uppercase tracking-wider">Upload New Poster</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#2B2B2B] mb-1">Poster Title / Campaign Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Summer Robotics Sale"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#EFE3D3] text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#2B2B2B] mb-1">Poster Image URL (or upload from file below)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/poster.jpg"
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#EFE3D3] text-[#2B2B2B] placeholder:text-[#8A7968]/70 focus:border-[#B76E79] focus:outline-hidden"
                    required
                  />
                </div>

                <div className="sm:col-span-2 bg-[#EFE3D3] p-4 rounded-2xl border border-[#8A7968]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#2B2B2B] block">Upload Poster from Laptop</span>
                    <span className="text-[10px] text-[#8A7968]">Select an image file (PNG, JPG, WEBP) to upload directly to cloud storage.</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, false)}
                    className="text-xs text-[#8A7968] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#B76E79]/15 file:text-[#B76E79] hover:file:bg-[#B76E79]/25 cursor-pointer"
                  />
                </div>

                {uploadingPoster && (
                  <div className="sm:col-span-2 text-xs text-[#B76E79] font-bold animate-pulse">
                    Uploading poster to cloud storage... Please wait...
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#2B2B2B] mb-1">Target Specific Customer Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="Leave blank for public store display, or enter customer email"
                    value={bannerTargetEmail}
                    onChange={(e) => setBannerTargetEmail(e.target.value)}
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#EFE3D3] text-[#2B2B2B] placeholder:text-[#8A7968]/70 font-medium focus:border-[#B76E79] focus:outline-hidden"
                  />
                </div>
              </div>
              <button type="submit" disabled={uploadingPoster} className="bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50 btn-press shadow-xs">
                Publish Poster 🚀
              </button>
            </form>

            <h3 className="text-xs font-bold text-[#2B2B2B] uppercase mt-8 mb-4">Active & Existing Posters</h3>
            {banners.length === 0 ? (
              <p className="text-xs text-[#8A7968] italic py-6 text-center">No promotional posters uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {banners.map((b) => (
                  <div key={b.id} className="border border-[#8A7968]/30 rounded-3xl p-4 bg-[#F4EADE] shadow-2xs space-y-3">
                    <div className="h-40 bg-[#2B2B2B] rounded-2xl overflow-hidden border border-[#8A7968]/30 flex items-center justify-center">
                      <img src={b.image_url} alt={b.title} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#2B2B2B]">{b.title}</h4>
                      <div className="text-[11px] text-[#B76E79] font-bold mt-1">
                        {b.target_customer_email ? `🔒 Exclusive to: ${b.target_customer_email}` : '🌐 Public Banner (Shown to all)'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#8A7968]/20 gap-2">
                      <button
                        onClick={() => openEditBannerModal(b)}
                        className="bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer flex-1 text-center border border-[#8A7968]/30"
                      >
                        Edit ✏️
                      </button>
                      <button
                        onClick={async () => {
                          await supabase.from('banners').update({ is_active: !b.is_active }).eq('id', b.id)
                          fetchBanners()
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          b.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-[#EADBC8] text-[#8A7968] border-[#8A7968]/30'
                        }`}
                      >
                        {b.is_active ? 'Active ✓' : 'Inactive ✕'}
                      </button>
                      <button
                        onClick={() => deleteBanner(b.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- EDIT BANNER MODAL ----------------- */}
        {editingBanner && (
          <div className="fixed inset-0 bg-[#2B2B2B]/85 backdrop-blur-xs flex justify-center items-center p-4 z-50">
            <div className="bg-[#EFE3D3] border border-[#8A7968]/40 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative space-y-4 max-h-[90vh] overflow-y-auto text-[#2B2B2B]">
              <h3 className="text-base font-black text-[#2B2B2B]">Edit Promotional Poster</h3>
              <form onSubmit={handleUpdateBanner} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Poster Title</label>
                  <input
                    type="text"
                    value={editBannerTitle}
                    onChange={(e) => setEditBannerTitle(e.target.value)}
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Poster Image URL (or upload new file)</label>
                  <input
                    type="url"
                    value={editBannerImageUrl}
                    onChange={(e) => setEditBannerImageUrl(e.target.value)}
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-mono focus:border-[#B76E79] focus:outline-hidden"
                    required
                  />
                </div>
                <div className="bg-[#F4EADE] p-3 rounded-2xl border border-[#8A7968]/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2B2B2B]">Upload New File Replacement</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="text-xs text-[#8A7968] file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#B76E79]/15 file:text-[#B76E79] cursor-pointer"
                  />
                </div>
                {uploadingEditPoster && <p className="text-xs text-[#B76E79] font-bold animate-pulse">Uploading new image...</p>}

                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Target Customer Email (Optional)</label>
                  <input
                    type="email"
                    value={editBannerTargetEmail}
                    onChange={(e) => setEditBannerTargetEmail(e.target.value)}
                    placeholder="Leave blank for public display"
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-medium focus:border-[#B76E79] focus:outline-hidden"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingBanner(null)}
                    className="w-1/2 bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] font-bold py-2.5 rounded-xl text-xs border border-[#8A7968]/30 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingEditPoster}
                    className="w-1/2 bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold py-2.5 rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50 btn-press"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- TAB: COUPONS MANAGEMENT ----------------- */}
        {activeTab === 'coupons' && (
          <div className="bg-[#EFE3D3] p-5 sm:p-8 rounded-3xl shadow-xs border border-[#8A7968]/30 space-y-6">
            <div className="border-b border-[#8A7968]/20 pb-4">
              <h2 className="text-xl font-black text-[#2B2B2B]">🏷️ Discount Coupons & Targeted Offers</h2>
              <p className="text-xs text-[#8A7968] mt-1">Create public promo codes or assign exclusive discounts to specific customer emails.</p>
            </div>

            <form onSubmit={handleCreateCoupon} className="bg-[#F4EADE] p-5 sm:p-6 rounded-3xl border border-[#8A7968]/30 space-y-4">
              <h3 className="text-xs font-bold text-[#B76E79] uppercase tracking-wider">Create New Coupon</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#2B2B2B] mb-1">Coupon Code</label>
                  <input
                    type="text"
                    placeholder="e.g. LABDISCOUNT10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs font-mono uppercase bg-[#EFE3D3] text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#2B2B2B] mb-1">Discount Type</label>
                  <select
                    value={couponDiscountType}
                    onChange={(e) => setCouponDiscountType(e.target.value)}
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#EFE3D3] text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#2B2B2B] mb-1">Value ({couponDiscountType === 'percentage' ? '%' : '₹'})</label>
                  <input
                    type="number"
                    placeholder={couponDiscountType === 'percentage' ? 'e.g. 10' : 'e.g. 100'}
                    value={couponDiscountValue}
                    onChange={(e) => setCouponDiscountValue(e.target.value)}
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#EFE3D3] text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#2B2B2B] mb-1">Min Order Amount (₹) Optional</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={couponMinOrder}
                    onChange={(e) => setCouponMinOrder(e.target.value)}
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#EFE3D3] text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#2B2B2B] mb-1">Assign to Specific Customer Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="Leave blank for public use, or enter customer email"
                    value={couponTargetEmail}
                    onChange={(e) => setCouponTargetEmail(e.target.value)}
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#EFE3D3] text-[#2B2B2B] font-medium focus:border-[#B76E79] focus:outline-hidden"
                  />
                </div>
              </div>
              <button type="submit" className="bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer btn-press shadow-xs">
                Create Coupon Code 🚀
              </button>
            </form>

            <h3 className="text-xs font-bold text-[#2B2B2B] uppercase mt-8 mb-4">Active & Existing Coupons</h3>
            {coupons.length === 0 ? (
              <p className="text-xs text-[#8A7968] italic py-6 text-center">No coupons created yet.</p>
            ) : (
              <div className="space-y-3">
                {coupons.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between border border-[#8A7968]/30 p-4 rounded-3xl bg-[#F4EADE] shadow-2xs gap-2">
                    <div>
                      <span className="font-mono font-black text-[#B76E79] text-sm tracking-wider">{c.code}</span>
                      <div className="text-xs text-[#2B2B2B] mt-0.5 font-bold">
                        {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                        {c.min_order_amount > 0 ? ` (Min order: ₹${c.min_order_amount})` : ''}
                      </div>
                      <div className="text-[11px] text-[#8A7968] font-semibold mt-1">
                        {c.target_customer_email ? `🔒 Restricted to: ${c.target_customer_email}` : '🌐 Public Coupon (Anyone can use)'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        onClick={() => openEditCouponModal(c)}
                        className="bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] text-xs font-bold px-3.5 py-2 rounded-xl border border-[#8A7968]/30 transition cursor-pointer"
                      >
                        Edit ✏️
                      </button>
                      <button
                        onClick={() => toggleCouponStatus(c.id, c.is_active)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          c.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-[#EADBC8] text-[#8A7968] border-[#8A7968]/30'
                        }`}
                      >
                        {c.is_active ? 'Active ✓' : 'Inactive ✕'}
                      </button>
                      <button
                        onClick={() => deleteCoupon(c.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- EDIT COUPON MODAL ----------------- */}
        {editingCoupon && (
          <div className="fixed inset-0 bg-[#2B2B2B]/85 backdrop-blur-xs flex justify-center items-center p-4 z-50">
            <div className="bg-[#EFE3D3] border border-[#8A7968]/40 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative space-y-4 max-h-[90vh] overflow-y-auto text-[#2B2B2B]">
              <h3 className="text-base font-black text-[#2B2B2B]">Edit Published Coupon</h3>
              <form onSubmit={handleUpdateCoupon} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={editCouponCode}
                    onChange={(e) => setEditCouponCode(e.target.value)}
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs font-mono uppercase bg-[#F4EADE] text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Discount Type</label>
                  <select
                    value={editCouponDiscountType}
                    onChange={(e) => setEditCouponDiscountType(e.target.value)}
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={editCouponDiscountValue}
                    onChange={(e) => setEditCouponDiscountValue(e.target.value)}
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={editCouponMinOrder}
                    onChange={(e) => setEditCouponMinOrder(e.target.value)}
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Target Customer Email (Optional)</label>
                  <input
                    type="email"
                    value={editCouponTargetEmail}
                    onChange={(e) => setEditCouponTargetEmail(e.target.value)}
                    placeholder="Leave blank for public use"
                    className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-medium focus:border-[#B76E79] focus:outline-hidden"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingCoupon(null)}
                    className="w-1/2 bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] font-bold py-2.5 rounded-xl text-xs border border-[#8A7968]/30 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold py-2.5 rounded-xl text-xs shadow-xs cursor-pointer btn-press"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- TAB: REVIEWS MODERATION ----------------- */}
        {activeTab === 'reviews' && (
          <div className="bg-[#EFE3D3] p-5 sm:p-6 rounded-3xl shadow-xs border border-[#8A7968]/30 space-y-6">
            <div className="border-b border-[#8A7968]/20 pb-4">
              <h2 className="text-xl font-black text-[#2B2B2B]">⭐ Customer Reviews Moderation</h2>
              <p className="text-xs text-[#8A7968] mt-1">Review feedback, verify authenticity, approve for public display, or remove spam.</p>
            </div>

            {adminReviews.length === 0 ? (
              <p className="text-xs text-[#8A7968] italic py-12 text-center">No customer reviews submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {adminReviews.map((rev) => (
                  <div key={rev.id} className="bg-[#F4EADE] p-4 sm:p-5 rounded-3xl border border-[#8A7968]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xs">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-bold text-[#2B2B2B]">{rev.customer_name}</span>
                        <span className="text-[10px] bg-[#EADBC8] text-[#B76E79] border border-[#8A7968]/30 font-bold px-2 py-0.5 rounded-lg">Product: {rev.products?.name || 'Item'}</span>
                        <span className="text-xs text-amber-600 font-bold">{'⭐'.repeat(rev.rating)}</span>
                        
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          rev.is_approved
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {rev.is_approved ? '✓ Publicly Approved' : '⏳ Pending Review'}
                        </span>
                      </div>
                      <p className="text-xs text-[#2B2B2B] leading-relaxed">{rev.comment}</p>
                      {rev.image_url && (
                        <a href={rev.image_url} target="_blank" rel="noreferrer" className="text-[11px] text-[#B76E79] font-bold hover:underline block">
                          📷 View Attached Customer Photo
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleReviewApproval(rev.id, Boolean(rev.is_approved))}
                        className={`text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer border shadow-2xs ${
                          rev.is_approved
                            ? 'bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#8A7968] border-[#8A7968]/30'
                            : 'bg-green-700 hover:bg-green-800 text-white border-green-700 btn-press'
                        }`}
                      >
                        {rev.is_approved ? 'Hide from Store ✕' : 'Approve Review ✓'}
                      </button>

                      <button
                        onClick={() => {
                          setReviewEditing(rev)
                          setEditReviewComment(rev.comment)
                          setEditReviewRating(rev.rating)
                        }}
                        className="bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] font-bold text-xs px-3.5 py-2 rounded-xl transition border border-[#8A7968]/30 cursor-pointer"
                      >
                        Edit ✏️
                      </button>
                      <button
                        onClick={() => handleAdminDeleteReview(rev.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-3.5 py-2 rounded-xl transition border border-red-200 cursor-pointer"
                      >
                        Delete ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Admin Edit Review Modal */}
            {editingReview && (
              <div className="fixed inset-0 bg-[#2B2B2B]/85 backdrop-blur-xs flex justify-center items-center p-4 z-50">
                <div className="bg-[#EFE3D3] border border-[#8A7968]/40 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative text-[#2B2B2B]">
                  <h3 className="text-base font-black text-[#2B2B2B] mb-4">Edit Customer Review</h3>
                  <form onSubmit={handleAdminUpdateReview} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Rating</label>
                      <select 
                        value={editReviewRating} 
                        onChange={(e) => setEditReviewRating(Number(e.target.value))}
                        className="border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-bold w-full focus:border-[#B76E79] focus:outline-hidden"
                      >
                        <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                        <option value="4">⭐⭐⭐⭐ (4/5)</option>
                        <option value="3">⭐⭐⭐ (3/5)</option>
                        <option value="2">⭐⭐ (2/5)</option>
                        <option value="1">⭐ (1/5)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Comment</label>
                      <textarea 
                        rows={4}
                        value={editReviewComment}
                        onChange={(e) => setEditReviewComment(e.target.value)}
                        className="w-full border border-[#8A7968]/40 p-3 rounded-xl text-xs text-[#2B2B2B] bg-[#F4EADE] focus:border-[#B76E79] focus:outline-hidden"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setReviewEditing(null)}
                        className="w-1/2 bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] font-bold py-2.5 rounded-xl text-xs border border-[#8A7968]/30 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="w-1/2 bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold py-2.5 rounded-xl text-xs shadow-xs cursor-pointer btn-press"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB: PAYMENTS MANAGEMENT ----------------- */}
        {activeTab === 'payments' && (
          <div className="bg-[#EFE3D3] p-6 sm:p-8 rounded-3xl shadow-xs border border-[#8A7968]/30 max-w-2xl mx-auto space-y-6 text-[#2B2B2B]">
            <div className="border-b border-[#8A7968]/20 pb-4">
              <h2 className="text-xl font-black text-[#2B2B2B]">💳 Payment Gateway Control Center</h2>
              <p className="text-xs text-[#8A7968] mt-1">Enable or disable payment options and customize customer checkout notices.</p>
            </div>

            <form onSubmit={handleSavePaymentSettings} className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F4EADE] border border-[#8A7968]/30">
                <div>
                  <h4 className="text-sm font-bold text-[#2B2B2B]">Razorpay Gateway</h4>
                  <p className="text-xs text-[#8A7968]">Accept Credit Cards, UPI, NetBanking online.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={paymentSettings.is_razorpay_enabled} 
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, is_razorpay_enabled: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-[#EADBC8] border border-[#8A7968]/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B76E79]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F4EADE] border border-[#8A7968]/30">
                <div>
                  <h4 className="text-sm font-bold text-[#2B2B2B]">Direct UPI / QR Transfer</h4>
                  <p className="text-xs text-[#8A7968]">Allow manual QR scanning and UTR submission.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={paymentSettings.is_upi_enabled} 
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, is_upi_enabled: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-[#EADBC8] border border-[#8A7968]/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B76E79]"></div>
                </label>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4EADE] border border-[#8A7968]/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#2B2B2B]">Cash on Delivery (COD)</h4>
                    <p className="text-xs text-[#8A7968]">Allow customers to pay upon delivery.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={paymentSettings.is_cod_enabled} 
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, is_cod_enabled: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-[#EADBC8] border border-[#8A7968]/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B76E79]"></div>
                  </label>
                </div>

                {!paymentSettings.is_cod_enabled && (
                  <div>
                    <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Disabled Message for Customers</label>
                    <input 
                      type="text"
                      value={paymentSettings.cod_message}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, cod_message: e.target.value })}
                      placeholder="Payments not accepting currently"
                      className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#EFE3D3] text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#B76E79] hover:bg-[#9E5B65] text-white font-extrabold py-3 rounded-xl text-sm shadow-xs transition cursor-pointer btn-press"
              >
                {loading ? 'Saving Changes...' : 'Save Payment Configurations 💾'}
              </button>
            </form>
          </div>
        )}

        {/* ----------------- MODALS ----------------- */}
        {activePrintOrder && (
          <OrderInvoiceModal
            order={activePrintOrder.order}
            type={activePrintOrder.type}
            onClose={() => setActivePrintOrder(null)}
          />
        )}

        {viewingCustomer && (
          <div className="fixed inset-0 bg-[#2B2B2B]/85 backdrop-blur-xs flex justify-center items-center p-4 z-50">
            <div className="bg-[#EFE3D3] border border-[#8A7968]/40 rounded-3xl shadow-2xl w-full max-w-4xl p-6 max-h-[92vh] overflow-y-auto text-[#2B2B2B]">
              <div className="flex justify-between items-center mb-6 border-b border-[#8A7968]/20 pb-4">
                <div>
                  <span className="text-xs font-bold text-[#B76E79] uppercase tracking-wider">Customer Profile Details</span>
                  <h3 className="text-2xl font-black text-[#2B2B2B] mt-1">{viewingCustomer.name}</h3>
                  <span className="text-xs font-mono text-[#2B2B2B] font-bold bg-[#EADBC8] px-2 py-0.5 rounded-lg border border-[#8A7968]/30">
                    Customer ID: {getTwelveDigitId(viewingCustomer.id)}
                  </span>
                </div>
                <button
                  onClick={() => setViewingCustomer(null)}
                  className="text-[#8A7968] hover:text-[#2B2B2B] font-bold text-lg bg-[#EADBC8] px-3 py-1 rounded-full cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-[#F4EADE] p-4 rounded-2xl border border-[#8A7968]/30">
                <div>
                  <span className="text-[11px] font-bold text-[#8A7968] uppercase block">Contact Email</span>
                  <span className="text-sm font-bold text-[#2B2B2B]">{viewingCustomer.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#8A7968] uppercase block">Phone Number</span>
                  <span className="text-sm font-bold text-[#2B2B2B]">{viewingCustomer.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#8A7968] uppercase block">Total Lifetime Spend</span>
                  <span className="text-base font-extrabold text-[#B76E79]">₹{viewingCustomer.total_spent}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-[#2B2B2B] uppercase">Current Active Dynamic Address (Profile)</h4>
                  {viewingCustomer.current_profile_address && !viewingCustomer.current_profile_address.includes('No dynamic address saved') && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(viewingCustomer.current_profile_address)
                        alert(`Address copied to clipboard!`)
                      }}
                      className="bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] text-[11px] font-bold px-2.5 py-1 rounded-lg transition border border-[#8A7968]/30 cursor-pointer"
                    >
                      📋 Copy Address
                    </button>
                  )}
                </div>
                <div className="bg-[#F4EADE] p-4 rounded-2xl border border-[#8A7968]/30 text-xs text-[#2B2B2B] leading-relaxed">
                  {viewingCustomer.current_profile_address}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#2B2B2B] uppercase mb-3">
                  Order History Logs ({viewingCustomer.order_logs.length})
                </h4>

                {viewingCustomer.order_logs.length === 0 ? (
                  <p className="text-xs text-[#8A7968] italic">No orders logged under this customer account yet.</p>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {viewingCustomer.order_logs.map((log: any) => (
                      <div key={log.id} className="bg-[#F4EADE] p-4 rounded-2xl border border-[#8A7968]/30 flex flex-wrap justify-between items-center gap-4 hover:border-[#B76E79] transition">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                              log.status === 'Cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                              log.status === 'Delivered' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-[#EADBC8] text-[#B76E79] border-[#8A7968]/30'
                            }`}>
                              {log.status || 'Pending'}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#2B2B2B]">Tracking: {log.tracking_id}</span>
                          </div>
                          <p className="text-xs text-[#8A7968]">
                            Items: {Array.isArray(log.items) ? log.items.map((i: any) => `${i.name} (${i.quantity}x)`).join(', ') : 'No items data'}
                          </p>
                          <span className="text-[11px] text-[#8A7968]/80 block mt-1">Date: {new Date(log.created_at).toLocaleString()}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-[#2B2B2B] block">₹{log.total_amount || log.final_payable_amount}</span>
                          <span className="text-[11px] text-[#8A7968]">{log.payment_method || 'Online'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {auditingProduct && (
          <div className="fixed inset-0 bg-[#2B2B2B]/85 backdrop-blur-xs flex justify-center items-center p-4 z-50">
            <div className="bg-[#EFE3D3] border border-[#8A7968]/40 rounded-3xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto text-[#2B2B2B]">
              <div className="flex justify-between items-center mb-6 border-b border-[#8A7968]/20 pb-3">
                <div>
                  <h3 className="text-lg font-black text-[#2B2B2B]">Stock & Order Audit Logs</h3>
                  <p className="text-xs text-[#8A7968]">Product: <span className="font-bold text-[#2B2B2B]">{auditingProduct.name}</span> (Current Stock: <span className="font-bold text-[#B76E79]">{auditingProduct.stock}</span>)</p>
                </div>
                <button onClick={() => setAuditingProduct(null)} className="text-[#8A7968] hover:text-[#2B2B2B] font-bold text-lg bg-[#EADBC8] px-3 py-1 rounded-full cursor-pointer">✕</button>
              </div>

              {productAuditLogs.length === 0 ? (
                <div className="text-center py-12 text-[#8A7968] text-sm">
                  No orders or logs found for this product yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {productAuditLogs.map((log: any) => {
                    const matchingItem = log.items.find((i: any) => (i.id || i.product_id) === auditingProduct.id || i.name === auditingProduct.name)
                    const orderedQty = matchingItem ? matchingItem.quantity : 1

                    return (
                      <div key={log.id} className="bg-[#F4EADE] p-4 rounded-2xl border border-[#8A7968]/30 flex flex-wrap justify-between items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                              log.status === 'Cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                              log.status === 'Delivered' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-[#EADBC8] text-[#B76E79] border-[#8A7968]/30'
                            }`}>
                              {log.status || 'Pending'}
                            </span>
                            <span className="text-xs font-mono text-[#8A7968]">Tracking: {log.tracking_id}</span>
                          </div>
                          <h4 className="text-sm font-bold text-[#2B2B2B]">Customer: {log.customer_name || 'Guest'}</h4>
                          <p className="text-xs text-[#8A7968] mt-0.5">Ordered Quantity: <span className="font-bold text-[#B76E79]">{orderedQty} units</span></p>
                          <span className="text-[11px] text-[#8A7968]/80 block mt-1">Date: {new Date(log.created_at).toLocaleString()}</span>
                        </div>

                        <div className="text-right text-xs">
                          {log.status === 'Delivered' && <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-lg font-bold border border-green-200 block">✓ Delivered Log</span>}
                          {log.status === 'Cancelled' && (
                            <div>
                              <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-lg font-bold border border-green-200 block mb-1">✕ Cancelled Log</span>
                              {log.cancellation_reason && <span className="text-[11px] text-[#8A7968] italic block whitespace-normal max-w-xs">{log.cancellation_reason}</span>}
                            </div>
                          )}
                          {log.status !== 'Delivered' && log.status !== 'Cancelled' && (
                            <span className="bg-[#EADBC8] text-[#2B2B2B] px-2.5 py-1 rounded-lg font-bold border border-[#8A7968]/30 block">Active Order</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeOrderGalleryImages && (
          <div className="fixed inset-0 bg-[#2B2B2B]/85 backdrop-blur-xs flex justify-center items-center p-4 z-50">
            <div className="bg-[#EFE3D3] border border-[#8A7968]/40 rounded-3xl shadow-2xl w-full max-w-2xl p-6 relative text-[#2B2B2B]">
              <div className="flex justify-between items-center mb-4 border-b border-[#8A7968]/20 pb-3">
                <h3 className="text-sm font-bold text-[#2B2B2B]">Product Image Gallery ({activeGalleryIndex + 1} of {activeOrderGalleryImages.length})</h3>
                <button onClick={() => setActiveOrderGalleryImages(null)} className="text-[#8A7968] hover:text-[#2B2B2B] font-bold text-lg bg-[#EADBC8] px-3 py-1 rounded-full cursor-pointer">✕</button>
              </div>
              <div className="bg-[#F4EADE] rounded-2xl overflow-hidden border border-[#8A7968]/30 h-96 flex items-center justify-center mb-4 relative">
                <img src={activeOrderGalleryImages[activeGalleryIndex]} alt="" className="w-full h-full object-contain p-4" />
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 justify-center no-scrollbar">
                {activeOrderGalleryImages.map((imgUrl, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveGalleryIndex(i)}
                    className={`border-2 rounded-2xl overflow-hidden w-20 h-20 flex-shrink-0 transition bg-[#F4EADE] ${activeGalleryIndex === i ? 'border-[#B76E79] scale-105 shadow-xs' : 'border-[#8A7968]/30 opacity-60'}`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewingProduct && (
          <div className="fixed inset-0 bg-[#2B2B2B]/85 backdrop-blur-xs flex justify-center items-center p-4 z-50">
            <div className="bg-[#EFE3D3] border border-[#8A7968]/40 rounded-3xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto text-[#2B2B2B]">
              <div className="flex justify-between items-center mb-6 border-b border-[#8A7968]/20 pb-3">
                <span className="text-xs bg-[#EADBC8] text-[#B76E79] font-bold px-3 py-1 rounded-full border border-[#8A7968]/30">Customer View Preview</span>
                <button onClick={() => setViewingProduct(null)} className="text-[#8A7968] hover:text-[#2B2B2B] font-bold text-lg bg-[#EADBC8] px-3 py-1 rounded-full cursor-pointer">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="mb-4 bg-[#F4EADE] rounded-2xl overflow-hidden border border-[#8A7968]/30 h-80 flex items-center justify-center">
                    <img src={activePreviewImage} alt="" className="w-full h-full object-contain p-3" />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {viewingProduct.image_url ? viewingProduct.image_url.split(',').map((url: string, i: number) => {
                      const cleanUrl = url.trim()
                      return (
                        <button key={i} onClick={() => setActivePreviewImage(cleanUrl)} className={`border-2 rounded-xl overflow-hidden w-16 h-16 flex-shrink-0 transition bg-[#F4EADE] ${activePreviewImage === cleanUrl ? 'border-[#B76E79] scale-105' : 'border-[#8A7968]/30 opacity-70'}`}>
                          <img src={cleanUrl} alt="" className="w-full h-full object-cover" />
                        </button>
                      )
                    }) : null}
                  </div>
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-[#B76E79] font-bold uppercase tracking-wider">{viewingProduct.category || 'General'}</span>
                    <h1 className="text-2xl font-black text-[#2B2B2B] mt-1 mb-2">{viewingProduct.name || viewingProduct.title}</h1>
                    <div className="text-3xl font-extrabold text-[#2B2B2B] mb-4">₹{viewingProduct.price}</div>
                    
                    {/* Customer view shipping badge preview */}
                    <div className="mb-4 bg-[#F4EADE] p-3 rounded-2xl border border-[#8A7968]/30">
                      <span className="text-[10px] font-extrabold text-[#8A7968] uppercase tracking-wider block">Shipping Information</span>
                      <p className="text-xs font-bold text-[#2B2B2B] mt-0.5">
                        ₹{viewingProduct.base_shipping_fee ?? 120} for 1st unit 
                        {(viewingProduct.extra_shipping_fee ?? 80) > 0 && ` (+₹${viewingProduct.extra_shipping_fee ?? 80} per additional unit)`}
                      </p>
                    </div>

                    <div className="num-stock mb-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${viewingProduct.stock > 0 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                        {viewingProduct.stock > 0 ? `In Stock (${viewingProduct.stock} available)` : 'Out of Stock'}
                      </span>
                    </div>
                    <div className="border-t border-[#8A7968]/20 pt-4 mt-4">
                      <h3 className="text-xs font-bold text-[#2B2B2B] uppercase mb-2">Product Description</h3>
                      <p className="text-sm text-[#8A7968] whitespace-pre-line leading-relaxed">{viewingProduct.description || 'No description provided.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingProduct && (
          <div className="fixed inset-0 bg-[#2B2B2B]/85 backdrop-blur-xs flex justify-center items-center p-4 z-50">
            <div className="bg-[#EFE3D3] border border-[#8A7968]/40 rounded-3xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto text-[#2B2B2B]">
              <div className="flex justify-between items-center mb-4 border-b border-[#8A7968]/20 pb-3">
                <h2 className="text-lg font-bold text-[#2B2B2B]">Edit {editIsBundle ? 'Lab Kit' : 'Product'}: {editingProduct.name}</h2>
                <button onClick={() => setEditingProduct(null)} className="text-[#8A7968] hover:text-[#2B2B2B] font-bold text-sm bg-[#EADBC8] px-2.5 py-0.5 rounded-full cursor-pointer">✕</button>
              </div>
              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div className="flex items-center justify-between bg-[#F4EADE] p-2.5 rounded-xl border border-[#8A7968]/30">
                  <span className="text-xs font-bold text-[#2B2B2B]">Product Type:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editIsBundle} 
                      onChange={(e) => setEditIsBundle(e.target.checked)} 
                      className="accent-[#B76E79]"
                    />
                    <span className="text-xs font-black text-[#B76E79]">Is Lab Kit / Bundle</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Name</label>
                  <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Price (₹)</label>
                    <input type="number" step="0.01" required value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2B2B2B] mb-1">
                      {editIsBundle ? 'Calculated Stock' : 'Stock'}
                    </label>
                    {editIsBundle ? (
                      <div className="w-full border border-[#8A7968]/30 bg-[#EADBC8]/70 p-2.5 rounded-xl text-xs text-[#2B2B2B] font-extrabold flex items-center justify-between">
                        <span>{calculateBundleStock(editingProduct.id, editKitComponents)} kits</span>
                        <span className="text-[10px] text-[#8A7968]">Live</span>
                      </div>
                    ) : (
                      <input type="number" required value={editStock} onChange={(e) => setEditStock(e.target.value)} className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden" />
                    )}
                  </div>
                </div>

                {/* Edit Recipe Component Mapping */}
                {editIsBundle && (
                  <div className="bg-[#F4EADE] p-3 rounded-2xl border border-[#8A7968]/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-[#2B2B2B] uppercase tracking-wide">
                        Kit Recipe Components ({editKitComponents.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddKitComponent(true)}
                        className="text-[10px] bg-[#B76E79] text-white px-2 py-1 rounded-lg font-bold hover:bg-[#9E5B65] cursor-pointer"
                      >
                        + Add Part
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {editKitComponents.map((comp, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-[#EFE3D3] p-2 rounded-xl border border-[#8A7968]/20">
                          <select
                            value={comp.component_id}
                            onChange={(e) => handleUpdateKitComponent(idx, 'component_id', e.target.value, true)}
                            className="w-full text-xs bg-[#F4EADE] p-1.5 rounded-lg border border-[#8A7968]/30 text-[#2B2B2B] font-medium focus:outline-hidden"
                          >
                            {products.filter(p => p.id !== editingProduct.id && !p.is_bundle).map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.stock} left)
                              </option>
                            ))}
                          </select>
                          <input 
                            type="number" 
                            min="1" 
                            value={comp.quantity} 
                            onChange={(e) => handleUpdateKitComponent(idx, 'quantity', parseInt(e.target.value) || 1, true)} 
                            className="w-14 text-center text-xs font-bold bg-[#F4EADE] p-1.5 rounded-lg border border-[#8A7968]/30"
                            title="Quantity per kit"
                          />
                          <button 
                            type="button" 
                            onClick={() => handleRemoveKitComponent(idx, true)} 
                            className="text-red-600 font-bold px-2 py-1 rounded-lg hover:bg-red-100 text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Per-Item Shipping Editing Inputs */}
                <div className="grid grid-cols-2 gap-2 bg-[#F4EADE] p-2.5 rounded-2xl border border-[#8A7968]/30">
                  <div>
                    <label className="block text-[11px] font-bold text-[#2B2B2B] mb-1">
                      Base Shipping (₹) [1st unit]
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={editBaseShippingFee} 
                      onChange={(e) => setEditBaseShippingFee(e.target.value)} 
                      placeholder="120" 
                      className="w-full border border-[#8A7968]/40 bg-[#EFE3D3] p-2 rounded-xl text-xs text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#2B2B2B] mb-1">
                      Extra Unit (+₹) [each addl.]
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={editExtraShippingFee} 
                      onChange={(e) => setEditExtraShippingFee(e.target.value)} 
                      placeholder="80" 
                      className="w-full border border-[#8A7968]/40 bg-[#EFE3D3] p-2 rounded-xl text-xs text-[#2B2B2B] font-bold focus:border-[#B76E79] focus:outline-hidden" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Category</label>
                  <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-medium focus:border-[#B76E79] focus:outline-hidden" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Product Details / Description</label>
                  <textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full border border-[#8A7968]/40 p-2.5 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] font-medium focus:border-[#B76E79] focus:outline-hidden" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B2B2B] mb-1">Product Image URLs</label>
                  {editImageInputs.map((url, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input type="url" value={url} onChange={(e) => handleEditImageInputChange(index, e.target.value)} placeholder="https://example.com/image.jpg" className="w-full border border-[#8A7968]/40 p-2 rounded-xl text-xs bg-[#F4EADE] text-[#2B2B2B] focus:border-[#B76E79] focus:outline-hidden" />
                      {editImageInputs.length > 1 && (
                        <button type="button" onClick={() => handleRemoveEditImageInput(index)} className="bg-red-50 border border-red-200 text-red-600 px-2.5 py-1 rounded-xl text-xs font-bold hover:bg-red-100 cursor-pointer">✕</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={handleAddEditImageInput} className="mt-1 bg-[#EADBC8] text-[#2B2B2B] hover:bg-[#8A7968]/30 font-bold text-xs px-3 py-2 rounded-xl transition w-full border border-dashed border-[#8A7968]/50 cursor-pointer">+ Add Another Image URL</button>
                </div>
                <div className="flex gap-3 pt-4 border-t border-[#8A7968]/20">
                  <button type="button" onClick={() => setEditingProduct(null)} className="w-1/2 bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] font-bold p-2.5 rounded-xl text-xs sm:text-sm border border-[#8A7968]/30 transition cursor-pointer">Cancel/Close</button>
                  <button type="submit" className="w-1/2 bg-[#B76E79] hover:bg-[#9E5B65] text-white font-bold p-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition cursor-pointer btn-press">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}