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

  // Banners & Posters Management State
  const [banners, setBanners] = useState<any[]>([])
  const [bannerTitle, setBannerTitle] = useState('')
  const [bannerImageUrl, setBannerImageUrl] = useState('')
  const [bannerTargetEmail, setBannerTargetEmail] = useState('')

  // Reviews Moderation State
  const [adminReviews, setAdminReviews] = useState<any[]>([])
  const [editingReview, setReviewEditing] = useState<any | null>(null)
  const [editReviewComment, setEditReviewComment] = useState('')
  const [editReviewRating, setEditReviewRating] = useState(5)

  // Inventory Products State
  const [products, setProducts] = useState<any[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [imageInputs, setImageInputs] = useState<string[]>([''])

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
  const [editImageInputs, setEditImageInputs] = useState<string[]>([''])

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

  // Fetch contextual settings when switching tabs
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

  const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id)
    fetchCoupons()
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    await supabase.from('coupons').delete().eq('id', id)
    fetchCoupons()
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
    alert('Poster uploaded successfully!')
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    const filteredImages = imageInputs.filter(url => url.trim() !== '').join(',')

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, 
          price: parseFloat(price), 
          stock: parseInt(stock), 
          category: category.trim(), 
          description,
          image_url: filteredImages 
        })
      })

      const data = await res.json()

      if (data.success) {
        setSuccessMsg('Product added successfully via secure admin API!')
        setName('')
        setPrice('')
        setStock('')
        setCategory('')
        setDescription('')
        setImageInputs([''])
        fetchAdminData()
      } else {
        setErrorMsg(`Failed to add product: ${data.error || 'Server error'}`)
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

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct.id,
          name: editName,
          price: parseFloat(editPrice),
          stock: parseInt(editStock),
          category: editCategory.trim(),
          description: editDescription,
          image_url: filteredImages,
          updated_at: new Date().toISOString()
        })
      })

      const data = await res.json()

      if (data.success) {
        setSuccessMsg('Product updated successfully!')
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

    const headers = ['name', 'price', 'stock', 'category', 'description', 'image_url']
    const rows = products.map(p => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.price || 0,
      p.stock || 0,
      `"${(p.category || 'General').replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
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
    const headers = ['name', 'price', 'stock', 'category', 'description', 'image_url']
    const sampleRows = [
      ['"Raspberry Pi 5 8GB"', '8999', '25', '"Single Board Computers"', '"Latest generation quad-core 64-bit Arm Cortex-A76"', '"https://images.unsplash.com/photo-1550745165-9bc0b252726f"'],
      ['"NodeMCU ESP8266 V3"', '249', '100', '"Microcontrollers"', '"Wi-Fi enabled IoT development board"', '"https://images.unsplash.com/photo-1518770660439-4636190af475"'],
      ['"Ultrasonic Sensor HC-SR04"', '99', '150', '"Sensors"', '"High precision distance measurement sensor"', '"https://images.unsplash.com/photo-1581092160607-ee22621dd758"']
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

    let matchesStock = true
    if (stockFilter === 'LOW') matchesStock = p.stock <= 5
    if (stockFilter === 'AVAILABLE') matchesStock = p.stock > 5
    if (stockFilter === 'OUT') matchesStock = p.stock === 0

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
  const lowStockProducts = products.filter(p => p.stock <= 5)

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
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-xl font-black text-indigo-900 leading-tight">Mahin's One-Stop One-Store</h1>
            <p className="text-xs text-gray-500 font-semibold mt-1">Admin Security Portal</p>
          </div>

          {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">{errorMsg}</div>}
          {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">{successMsg}</div>}

          {authStep === 'credentials' && (
            <form onSubmit={handleSendEmailOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Admin Email</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Enter admin email..." 
                  className="w-full border border-gray-300 p-3 rounded-lg text-sm text-gray-900 focus:outline-indigo-600" 
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700">Admin Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setAuthStep('forgot_password'); setErrorMsg(''); setSuccessMsg(''); }}
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
                    placeholder="Enter password..." 
                    className="w-full border border-gray-300 p-3 rounded-lg text-sm text-gray-900 focus:outline-indigo-600 pr-16" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-gray-100 px-2 py-1 rounded"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-lg text-sm shadow-lg transition disabled:opacity-50">
                {loading ? 'Sending OTP to Email...' : 'Send OTP to Email →'}
              </button>
            </form>
          )}

          {authStep === 'forgot_password' && (
            <form onSubmit={handleAdminForgotPassword} className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-xl text-center mb-2 border border-amber-200">
                <p className="text-xs text-amber-900 font-medium">Enter your registered admin email address to receive an instant recovery code.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Admin Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="mahinsonestoponestore@gmail.com" 
                  className="w-full border border-gray-300 p-3 rounded-lg text-sm text-gray-900 focus:outline-indigo-600" 
                />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-lg text-sm shadow transition disabled:opacity-50">
                {loading ? 'Dispatching Recovery OTP...' : 'Send Recovery OTP to Email'}
              </button>

              <button 
                type="button" 
                onClick={() => { setAuthStep('credentials'); setErrorMsg(''); setSuccessMsg(''); }} 
                className="w-full text-xs text-gray-500 hover:underline mt-2 text-center block"
              >
                ← Back to Password Login
              </button>
            </form>
          )}

          {authStep === 'otp' && (
            <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-xl text-center mb-4">
                <p className="text-xs text-indigo-900 font-medium">A security OTP was sent to <span className="font-bold">{email}</span></p>
                <p className="text-[10px] text-gray-500 mt-1">Please check your inbox or spam folder</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Enter 6-Digit OTP Token</label>
                <input 
                  type="text" 
                  required 
                  value={otpToken} 
                  onChange={(e) => setOtpToken(e.target.value)} 
                  placeholder="Enter 6-digit code..." 
                  className="w-full border border-indigo-300 bg-indigo-50/50 p-3 rounded-lg text-center tracking-widest text-lg font-bold text-indigo-900 focus:outline-indigo-600" 
                />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold p-3 rounded-lg text-sm shadow-lg transition disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & Enter Dashboard'}
              </button>
               
              <button 
                type="button" 
                onClick={() => { setAuthStep('credentials'); setOtpToken(''); setSuccessMsg(''); }} 
                className="w-full text-xs text-gray-500 hover:underline mt-2 text-center block"
              >
                ← Back to Login
              </button>
            </form>
          )}

          <div className="mt-6 text-center border-t pt-4">
            <Link href="/" className="text-xs font-semibold text-indigo-600 hover:underline">← Return to Storefront</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white px-8 py-6 shadow-sm mb-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-extrabold text-indigo-900">Mahin's One-Stop One-Store — Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full">Secure Admin Active</span>
            <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline">Store</Link>
            <button 
              onClick={handleLogout} 
              className="bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Logout 🔒
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4">
        {errorMsg && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300 font-medium">{errorMsg}</div>}
        {successMsg && <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg border border-green-300 font-medium">{successMsg}</div>}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-4 mb-8 border-b pb-4">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-100'
            }`}
          >
            📊 Analytics & Insights
          </button>
          <button
            onClick={() => setActiveTab('upi_verifications')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition cursor-pointer relative flex items-center gap-2 ${
              activeTab === 'upi_verifications' ? 'bg-amber-600 text-white shadow-md' : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
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
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition cursor-pointer ${
              activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-100'
            }`}
          >
            🛒 Customer Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition cursor-pointer ${
              activeTab === 'products' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-100'
            }`}
          >
            📦 Inventory Management ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'customers' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-100'
            }`}
          >
            👥 Customers Directory ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'coupons' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-100'
            }`}
          >
            🏷️ Coupons ({coupons.length})
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'banners' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-100'
            }`}
          >
            🖼️ Posters ({banners.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'payments' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-100'
            }`}
          >
            💳 Payments
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'reviews' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-100'
            }`}
          >
            ⭐ Reviews Moderation
          </button>
        </div>

        {/* ----------------- TAB: BANNERS / POSTERS MANAGEMENT ----------------- */}
        {activeTab === 'banners' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-xl font-black text-indigo-950">🖼️ Store Promotional Posters & Banners</h2>
              <p className="text-xs text-gray-500 mt-1">Upload custom store posters or targeted banners for specific customer accounts.</p>
            </div>

            <form onSubmit={handleCreateBanner} className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4">
              <h3 className="text-xs font-bold text-indigo-950 uppercase">Upload / Add New Poster</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Poster Title / Campaign Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Special Festival Discount Poster"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    className="w-full border p-2.5 rounded-xl text-xs bg-white text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Poster Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/poster.jpg"
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    className="w-full border p-2.5 rounded-xl text-xs bg-white text-gray-900"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Target Specific Customer Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="Leave blank to show to everyone, or enter specific customer email"
                    value={bannerTargetEmail}
                    onChange={(e) => setBannerTargetEmail(e.target.value)}
                    className="w-full border p-2.5 rounded-xl text-xs bg-white text-gray-900 font-medium"
                  />
                </div>
              </div>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer">
                Publish Poster 🚀
              </button>
            </form>

            <h3 className="text-xs font-bold text-gray-800 uppercase mt-8 mb-4">Active & Existing Posters</h3>
            {banners.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-6 text-center">No promotional posters uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {banners.map((b) => (
                  <div key={b.id} className="border rounded-2xl p-4 bg-white shadow-sm space-y-3">
                    <div className="h-40 bg-gray-100 rounded-xl overflow-hidden border">
                      <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{b.title}</h4>
                      <div className="text-[11px] text-indigo-600 font-bold mt-1">
                        {b.target_customer_email ? `🔒 Exclusive to: ${b.target_customer_email}` : '🌐 Public Banner (Shown to all)'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <button
                        onClick={async () => {
                          await supabase.from('banners').update({ is_active: !b.is_active }).eq('id', b.id)
                          fetchBanners()
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          b.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {b.is_active ? 'Active ✓' : 'Inactive ✕'}
                      </button>
                      <button
                        onClick={() => deleteBanner(b.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
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

        {/* ----------------- TAB: COUPONS MANAGEMENT ----------------- */}
        {activeTab === 'coupons' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-xl font-black text-indigo-950">🏷️ Discount Coupons & Targeted Offers</h2>
              <p className="text-xs text-gray-500 mt-1">Create public promo codes or assign exclusive discounts to specific customer emails.</p>
            </div>

            <form onSubmit={handleCreateCoupon} className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4">
              <h3 className="text-xs font-bold text-indigo-950 uppercase">Create New Coupon</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    placeholder="e.g. LABDISCOUNT10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full border p-2.5 rounded-xl text-xs font-mono uppercase bg-white text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={couponDiscountType}
                    onChange={(e) => setCouponDiscountType(e.target.value)}
                    className="w-full border p-2.5 rounded-xl text-xs bg-white text-gray-900 font-bold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Value ({couponDiscountType === 'percentage' ? '%' : '₹'})</label>
                  <input
                    type="number"
                    placeholder={couponDiscountType === 'percentage' ? 'e.g. 10' : 'e.g. 100'}
                    value={couponDiscountValue}
                    onChange={(e) => setCouponDiscountValue(e.target.value)}
                    className="w-full border p-2.5 rounded-xl text-xs bg-white text-gray-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Min Order Amount (₹) Optional</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={couponMinOrder}
                    onChange={(e) => setCouponMinOrder(e.target.value)}
                    className="w-full border p-2.5 rounded-xl text-xs bg-white text-gray-900 font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Assign to Specific Customer Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="Leave blank for public use, or enter customer email"
                    value={couponTargetEmail}
                    onChange={(e) => setCouponTargetEmail(e.target.value)}
                    className="w-full border p-2.5 rounded-xl text-xs bg-white text-gray-900 font-medium"
                  />
                </div>
              </div>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer">
                Create Coupon Code 🚀
              </button>
            </form>

            <h3 className="text-xs font-bold text-gray-800 uppercase mt-8 mb-4">Active & Existing Coupons</h3>
            {coupons.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-6 text-center">No coupons created yet.</p>
            ) : (
              <div className="space-y-3">
                {coupons.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between border p-4 rounded-2xl bg-white shadow-sm gap-2">
                    <div>
                      <span className="font-mono font-black text-indigo-900 text-sm tracking-wider">{c.code}</span>
                      <div className="text-xs text-gray-600 mt-0.5 font-medium">
                        {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                        {c.min_order_amount > 0 ? ` (Min order: ₹${c.min_order_amount})` : ''}
                      </div>
                      <div className="text-[11px] text-indigo-600 font-bold mt-1">
                        {c.target_customer_email ? `🔒 Restricted to: ${c.target_customer_email}` : '🌐 Public Coupon (Anyone can use)'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCouponStatus(c.id, c.is_active)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {c.is_active ? 'Active ✓' : 'Inactive ✕'}
                      </button>
                      <button
                        onClick={() => deleteCoupon(c.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
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

        {/* ----------------- TAB: REVIEWS MODERATION ----------------- */}
        {activeTab === 'reviews' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-xl font-black text-indigo-950">⭐ Customer Reviews Moderation</h2>
              <p className="text-xs text-gray-500 mt-1">Review feedback, edit comments, or delete inappropriate reviews.</p>
            </div>

            {adminReviews.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-12 text-center">No customer reviews submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {adminReviews.map((rev) => (
                  <div key={rev.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-bold text-gray-900">{rev.customer_name}</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">Product: {rev.products?.name || 'Item'}</span>
                        <span className="text-xs text-amber-500 font-bold">{'⭐'.repeat(rev.rating)}</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>
                      {rev.image_url && (
                        <a href={rev.image_url} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 font-bold hover:underline block">
                          📷 View Attached Customer Photo
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setReviewEditing(rev)
                          setEditReviewComment(rev.comment)
                          setEditReviewRating(rev.rating)
                        }}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3.5 py-2 rounded-xl transition border border-indigo-200 cursor-pointer"
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
              <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 relative">
                  <h3 className="text-base font-black text-indigo-950 mb-4">Edit Customer Review</h3>
                  <form onSubmit={handleAdminUpdateReview} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Rating</label>
                      <select 
                        value={editReviewRating} 
                        onChange={(e) => setEditReviewRating(Number(e.target.value))}
                        className="border border-gray-300 p-2.5 rounded-xl text-xs bg-white text-gray-900 font-bold w-full"
                      >
                        <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                        <option value="4">⭐⭐⭐⭐ (4/5)</option>
                        <option value="3">⭐⭐⭐ (3/5)</option>
                        <option value="2">⭐⭐ (2/5)</option>
                        <option value="1">⭐ (1/5)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Comment</label>
                      <textarea 
                        rows={4}
                        value={editReviewComment}
                        onChange={(e) => setEditReviewComment(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-xl text-xs text-gray-900 bg-white"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setReviewEditing(null)}
                        className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow cursor-pointer"
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
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 max-w-2xl mx-auto space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-xl font-black text-indigo-950">💳 Payment Gateway Control Center</h2>
              <p className="text-xs text-gray-500 mt-1">Enable or disable payment options and customize customer checkout notices.</p>
            </div>

            <form onSubmit={handleSavePaymentSettings} className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Razorpay Gateway</h4>
                  <p className="text-xs text-gray-500">Accept Credit Cards, UPI, NetBanking online.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={paymentSettings.is_razorpay_enabled} 
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, is_razorpay_enabled: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Direct UPI / QR Transfer</h4>
                  <p className="text-xs text-gray-500">Allow manual QR scanning and UTR submission.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={paymentSettings.is_upi_enabled} 
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, is_upi_enabled: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Cash on Delivery (COD)</h4>
                    <p className="text-xs text-gray-500">Allow customers to pay upon delivery.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={paymentSettings.is_cod_enabled} 
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, is_cod_enabled: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {!paymentSettings.is_cod_enabled && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Disabled Message for Customers</label>
                    <input 
                      type="text"
                      value={paymentSettings.cod_message}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, cod_message: e.target.value })}
                      placeholder="Payments not accepting currently"
                      className="w-full border border-gray-300 p-2.5 rounded-xl text-xs bg-white text-gray-900 focus:outline-indigo-600"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl text-sm shadow-md transition cursor-pointer"
              >
                {loading ? 'Saving Changes...' : 'Save Payment Configurations 💾'}
              </button>
            </form>
          </div>
        )}

        {/* ----------------- TAB: UPI VERIFICATIONS ----------------- */}
        {activeTab === 'upi_verifications' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">⚡ Direct UPI / QR Payment Verification Center</h2>
                <p className="text-xs text-gray-500">Review, verify, or reject direct QR/UPI transfers safely</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
                <input
                  type="text"
                  value={upiSearchQuery}
                  onChange={(e) => setUpiSearchQuery(e.target.value)}
                  placeholder="🔍 Search name, tracking ID, amount, UTR..."
                  className="border border-gray-300 p-2.5 rounded-xl text-xs w-full sm:w-80 text-gray-900 focus:outline-indigo-600 bg-gray-50/50"
                />

                <select
                  value={upiStatusFilter}
                  onChange={(e) => setUpiStatusFilter(e.target.value)}
                  className="border border-gray-300 p-2.5 rounded-xl text-xs bg-white text-gray-700 font-medium"
                >
                  <option value="ALL">All Statuses ({allUpiOrders.length})</option>
                  <option value="PENDING">Pending Only ({upiPendingOrders.length})</option>
                  <option value="APPROVED">Approved Only</option>
                  <option value="REJECTED">Rejected / Cancelled</option>
                </select>

                {(upiSearchQuery || upiStatusFilter !== 'ALL') && (
                  <button
                    onClick={() => { setUpiSearchQuery(''); setUpiStatusFilter('ALL'); }}
                    className="text-xs text-red-600 hover:underline font-bold px-3 py-2 bg-red-50 rounded-xl"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {filteredUpiVerifications.length === 0 ? (
              <div className="py-16 text-center bg-gray-50 rounded-2xl border border-gray-200">
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-sm font-bold text-gray-700">No UPI payment records match your search criteria.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredUpiVerifications.map((o) => {
                  const twelveCustId = getTwelveDigitId(o.user_id)
                  const orderDate = o.created_at ? new Date(o.created_at).toLocaleString() : 'N/A'
                  const statusLower = (o.status || '').toLowerCase()
                  const isPending = statusLower === 'pending verification' || statusLower === 'pending'
                  const isCancelled = statusLower === 'cancelled'
                  const cleanUtr = extractUtrNumber(o.payment_method)

                  return (
                    <div key={o.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:border-amber-300 transition space-y-5">
                      <div className="flex flex-wrap justify-between items-center border-b pb-4 gap-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Tracking ID</span>
                            <span className="font-mono text-base font-black text-indigo-950">{o.tracking_id}</span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500 font-semibold">🕒 {orderDate}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Total Amount</span>
                            <span className="text-xl font-black text-indigo-950">₹{o.total_amount || o.final_payable_amount}</span>
                          </div>
                          <div className="text-right">
                            <span className={`px-3.5 py-1.5 rounded-full font-black text-[11px] uppercase inline-block ${
                              isPending ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                              isCancelled ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-green-100 text-green-900 border border-green-300'
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

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
                        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">Customer Details</span>
                          <div className="font-extrabold text-gray-900 text-sm">{o.customer_name}</div>
                          <div className="text-gray-500 font-medium">{o.customer_email}</div>
                          <span className="inline-block mt-1 text-[10px] font-mono text-indigo-800 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                            ID: {twelveCustId}
                          </span>
                        </div>

                        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">UTR Number</span>
                          <span className="inline-block bg-white text-indigo-950 font-mono font-black px-3 py-2 rounded-xl border border-indigo-200 text-xs shadow-2xs">
                            {cleanUtr}
                          </span>
                        </div>

                        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-2">
                          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">Items Ordered</span>
                          {Array.isArray(o.items) && o.items.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                              {o.items.map((item: any, idx: number) => {
                                const itemImg = item.image_url ? item.image_url.split(',')[0].trim() : 'https://via.placeholder.com/40'
                                const twelveDigitId = getTwelveDigitId(item.id || item.product_id || '')
                                return (
                                  <div key={idx} className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-gray-200 shadow-2xs">
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
                                      <img src={itemImg} alt="" className="w-9 h-9 object-cover rounded-lg border bg-white hover:border-indigo-600 transition" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-gray-900 truncate text-xs">{item.name}</div>
                                      <div className="text-[10px] text-indigo-600 font-bold">Qty: {item.quantity} • ID: {twelveDigitId}</div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No items listed</span>
                          )}
                        </div>

                        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-2">
                          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">Shipping Address</span>
                          <div className="bg-white p-3 rounded-xl border border-gray-200 leading-relaxed max-h-32 overflow-y-auto text-[11px] text-gray-800 shadow-2xs">
                            {o.shipping_address || 'No address provided'}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(o.shipping_address || '')
                              alert('Shipping address copied to clipboard!')
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold px-3 py-1.5 rounded-xl transition border border-indigo-200 cursor-pointer block w-full text-center"
                          >
                            📋 Copy Full Address
                          </button>
                        </div>
                      </div>

                      {isPending && (
                        <div className="flex justify-end gap-3 pt-4 border-t">
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'Cancelled')}
                            className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-6 py-3 rounded-xl transition border border-red-200 cursor-pointer"
                          >
                            ✕ Reject & Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'Processing')}
                            className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs px-8 py-3 rounded-xl shadow-md transition cursor-pointer"
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

        {/* ----------------- TAB 0: ANALYTICS & INSIGHTS ----------------- */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Active Gross Revenue</span>
                <h3 className="text-2xl font-black text-indigo-950">₹{totalRevenue.toLocaleString()}</h3>
                <span className="text-[11px] text-green-600 font-semibold mt-2 block">✓ Excludes cancelled orders</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Delivered Net Revenue</span>
                <h3 className="text-2xl font-black text-green-700">₹{deliveredRevenue.toLocaleString()}</h3>
                <span className="text-[11px] text-gray-500 font-semibold mt-2 block">{getAdminOrderCount('Delivered')} fulfilled orders</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Average Order Value (AOV)</span>
                <h3 className="text-2xl font-black text-indigo-900">₹{averageOrderValue.toLocaleString()}</h3>
                <span className="text-[11px] text-indigo-600 font-semibold mt-2 block">Per active checkout</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Order Volume</span>
                <h3 className="text-2xl font-black text-gray-900">{orders.length} Orders</h3>
                <span className="text-[11px] text-gray-500 font-semibold mt-2 block">{customers.length} total customer accounts</span>
              </div>
            </div>

            <SalesCharts orders={orders} products={products} />

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    ⚠️ Low Stock Warning Center
                    <span className="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                      {lowStockProducts.length} Items Critical
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">Inventory items with 5 units or less remaining in warehouse</p>
                </div>
                <button
                  onClick={() => { setActiveTab('products'); setStockFilter('LOW'); }}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Manage In Inventory →
                </button>
              </div>

              {lowStockProducts.length === 0 ? (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-xs text-green-800 font-semibold">
                  ✓ All products are comfortably stocked (&gt; 5 units).
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lowStockProducts.map((p) => (
                    <div key={p.id} className="bg-red-50/50 p-3.5 rounded-xl border border-red-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{p.name || p.title}</h4>
                        <span className="text-[11px] text-gray-500">{p.category || 'General'}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${p.stock === 0 ? 'bg-red-600 text-white' : 'bg-red-200 text-red-900'}`}>
                        {p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} left`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-1">🏆 Top Performing Products</h3>
              <p className="text-xs text-gray-500 mb-6">Ranked by total quantity sold across active customer orders</p>

              {topSellingProducts.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No order data available to generate performance leaderboard.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-600">
                        <th className="p-3">Rank</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-center">Units Sold</th>
                        <th className="p-3 text-right">Total Revenue Generated</th>
                        <th className="p-3 text-right">Current Available Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSellingProducts.slice(0, 8).map((p, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-bold text-indigo-900">#{idx + 1}</td>
                          <td className="p-3 font-bold text-gray-900">{p.name}</td>
                          <td className="p-3 text-center font-extrabold text-indigo-600">{p.unitsSold} pcs</td>
                          <td className="p-3 text-right font-black text-gray-900">₹{p.totalSales.toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${p.currentStock > 5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">📦 Order Status Distribution</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
                  <span className="text-[11px] font-bold text-amber-800 uppercase block">Pending</span>
                  <span className="text-xl font-black text-amber-900 mt-1 block">{getAdminOrderCount('Pending')}</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                  <span className="text-[11px] font-bold text-blue-800 uppercase block">Processing</span>
                  <span className="text-xl font-black text-blue-900 mt-1 block">{getAdminOrderCount('Processing')}</span>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center">
                  <span className="text-[11px] font-bold text-purple-800 uppercase block">Shipped</span>
                  <span className="text-xl font-black text-purple-900 mt-1 block">{getAdminOrderCount('Shipped')}</span>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
                  <span className="text-[11px] font-bold text-green-800 uppercase block">Delivered</span>
                  <span className="text-xl font-black text-green-900 mt-1 block">{getAdminOrderCount('Delivered')}</span>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center">
                  <span className="text-[11px] font-bold text-red-800 uppercase block">Cancelled</span>
                  <span className="text-xl font-black text-red-900 mt-1 block">{getAdminOrderCount('Cancelled')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 1: INVENTORY MANAGEMENT ----------------- */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                  📁 Bulk Inventory Management (CSV / Excel)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Import dozens of electronics/robotics components at once or export full warehouse records
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                <button type="button" onClick={handleDownloadSampleCSV} className="bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl border border-gray-300 transition cursor-pointer">📝 Sample Template</button>
                <button type="button" onClick={handleExportCSV} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-indigo-200 transition cursor-pointer">📤 Export Inventory CSV</button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition cursor-pointer">📥 Upload Bulk CSV</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-md h-fit">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Add Single Product</h2>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Product Name</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Arduino Uno R3" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹)</label>
                      <input type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="599" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Stock</label>
                      <input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} placeholder="50" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Category (Select existing or type new)</label>
                    <input type="text" list="existing-categories" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Microcontrollers, Sensor" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 focus:outline-indigo-600" />
                    <datalist id="existing-categories">
                      {categoriesList.map((cat: any, idx: number) => <option key={idx} value={cat} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Product Details / Description</label>
                    <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter full specifications..." className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Product Image URLs</label>
                    {imageInputs.map((url, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input type="url" value={url} onChange={(e) => handleImageInputChange(index, e.target.value)} placeholder="https://example.com/image.jpg" className="w-full border border-gray-300 p-2 rounded-lg text-xs text-gray-900" />
                        {imageInputs.length > 1 && (
                          <button type="button" onClick={() => handleRemoveImageInput(index)} className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold hover:bg-red-100">✕</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={handleAddImageInput} className="mt-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs px-3 py-1.5 rounded-lg transition w-full border border-dashed border-indigo-300">+ Add Another Image URL</button>
                  </div>

                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-lg text-sm shadow">Add Product</button>
                </form>
              </div>

              <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4">
                  <h2 className="text-lg font-bold text-gray-900">Store Inventory ({filteredProducts.length})</h2>
                   
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name, ID, category..."
                      className="border border-gray-300 p-2 rounded-lg text-xs w-full md:w-48 text-gray-900 focus:outline-indigo-600"
                    />

                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="border border-gray-300 p-2 rounded-lg text-xs bg-white text-gray-700 font-medium"
                    >
                      <option value="ALL">All Categories</option>
                      {categoriesList.map((cat: any, i) => (
                        <option key={i} value={cat}>{cat}</option>
                      ))}
                    </select>

                    <select
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value)}
                      className="border border-gray-300 p-2 rounded-lg text-xs bg-white text-gray-700 font-medium"
                    >
                      <option value="ALL">All Stock Levels</option>
                      <option value="AVAILABLE">In Stock (&gt;5)</option>
                      <option value="LOW">Low Stock (≤5)</option>
                      <option value="OUT">Out of Stock (0)</option>
                    </select>

                    {(searchQuery || selectedCategoryFilter !== 'ALL' || stockFilter !== 'ALL') && (
                      <button
                        onClick={() => { setSearchQuery(''); setSelectedCategoryFilter('ALL'); setStockFilter('ALL'); }}
                        className="text-xs text-red-600 hover:underline font-bold px-2 py-1 bg-red-50 rounded"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <p className="text-gray-500">Loading inventory...</p>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-gray-500">No products match your search or filter criteria.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50 text-gray-600 text-xs">
                          <th className="p-3">Product ID & Name</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Stock (Click to Audit Logs)</th>
                          <th className="p-3">Timestamps</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((p) => {
                          const firstImage = p.image_url ? p.image_url.split(',')[0].trim() : 'https://via.placeholder.com/50'
                          const addedDate = p.created_at ? new Date(p.created_at).toLocaleString() : 'N/A'
                          const updatedDate = p.updated_at ? new Date(p.updated_at).toLocaleString() : null
                          const twelveDigitId = getTwelveDigitId(p.id)

                          return (
                            <tr key={p.id} className="border-b hover:bg-gray-50 align-top">
                              <td className="p-3 flex items-center gap-3">
                                <img src={firstImage} alt="" className="h-10 w-10 object-cover rounded border bg-white flex-shrink-0" />
                                <div>
                                  <button onClick={() => openCustomerPreview(p)} className="font-bold text-indigo-600 hover:underline text-left block cursor-pointer">
                                    {p.name || p.title || 'Unnamed'}
                                  </button>
                                  <span className="text-[10px] text-gray-400 font-mono tracking-wider block">ID: {twelveDigitId}</span>
                                  <span className="text-xs text-gray-500">{p.category || 'General'}</span>
                                </div>
                              </td>
                              <td className="p-3 font-semibold text-gray-800 whitespace-nowrap">₹{p.price}</td>
                              <td className="p-3 whitespace-nowrap">
                                <button
                                  onClick={() => openStockAuditModal(p)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer hover:underline ${
                                    p.stock > 5 ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                                  }`}
                                  title="Click to view customer order & audit logs"
                                >
                                  {p.stock} left 📊
                                </button>
                              </td>
                              <td className="p-3 text-[11px] text-gray-500 whitespace-nowrap">
                                <div><span className="font-semibold text-gray-700">Added:</span> {addedDate}</div>
                                {updatedDate && <div><span className="font-semibold text-indigo-700">Edited:</span> {updatedDate}</div>}
                              </td>
                              <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                <button onClick={() => openCustomerPreview(p)} className="text-green-600 hover:text-green-800 font-semibold text-xs bg-green-50 px-2 py-1.5 rounded cursor-pointer">View</button>
                                <button onClick={() => openEditModal(p)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs bg-indigo-50 px-2 py-1.5 rounded cursor-pointer">Edit</button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:text-red-800 font-semibold text-xs bg-red-50 px-2 py-1.5 rounded cursor-pointer">Delete</button>
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
      </div>

      {/* ----------------- MODALS ----------------- */}
      {activePrintOrder && (
        <OrderInvoiceModal
          order={activePrintOrder.order}
          type={activePrintOrder.type}
          onClose={() => setActivePrintOrder(null)}
        />
      )}

      {viewingCustomer && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Customer Profile Details</span>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{viewingCustomer.name}</h3>
                <span className="text-xs font-mono text-indigo-800 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Customer ID: {getTwelveDigitId(viewingCustomer.id)}
                </span>
              </div>
              <button
                onClick={() => setViewingCustomer(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg bg-gray-100 px-3 py-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Contact Email</span>
                <span className="text-sm font-bold text-gray-900">{viewingCustomer.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Phone Number</span>
                <span className="text-sm font-bold text-gray-900">{viewingCustomer.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Total Lifetime Spend</span>
                <span className="text-base font-extrabold text-indigo-900">₹{viewingCustomer.total_spent}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase">Current Active Dynamic Address (Profile)</h4>
                {viewingCustomer.current_profile_address && !viewingCustomer.current_profile_address.includes('No dynamic address saved') && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(viewingCustomer.current_profile_address)
                      alert(`Address copied to clipboard!`)
                    }}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold px-2.5 py-1 rounded-lg transition border border-indigo-200 cursor-pointer"
                  >
                    📋 Copy Address
                  </button>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs text-gray-800 leading-relaxed">
                {viewingCustomer.current_profile_address}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">
                Order History Logs ({viewingCustomer.order_logs.length})
              </h4>

              {viewingCustomer.order_logs.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No orders logged under this customer account yet.</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {viewingCustomer.order_logs.map((log: any) => (
                    <div key={log.id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap justify-between items-center gap-4 hover:border-indigo-300 transition">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            log.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            log.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {log.status || 'Pending'}
                          </span>
                          <span className="text-xs font-mono font-bold text-indigo-950">Tracking: {log.tracking_id}</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Items: {Array.isArray(log.items) ? log.items.map((i: any) => `${i.name} (${i.quantity}x)`).join(', ') : 'No items data'}
                        </p>
                        <span className="text-[11px] text-gray-400 block mt-1">Date: {new Date(log.created_at).toLocaleString()}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-indigo-900 block">₹{log.total_amount || log.final_payable_amount}</span>
                        <span className="text-[11px] text-gray-500">{log.payment_method || 'Online'}</span>
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
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-indigo-900">Stock & Order Audit Logs</h3>
                <p className="text-xs text-gray-500">Product: <span className="font-bold text-gray-800">{auditingProduct.name}</span> (Current Stock: <span className="font-bold text-indigo-600">{auditingProduct.stock}</span>)</p>
              </div>
              <button onClick={() => setAuditingProduct(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg bg-gray-100 px-3 py-1 rounded-full cursor-pointer">✕</button>
            </div>

            {productAuditLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No orders or logs found for this product yet.
              </div>
            ) : (
              <div className="space-y-4">
                {productAuditLogs.map((log: any) => {
                  const matchingItem = log.items.find((i: any) => (i.id || i.product_id) === auditingProduct.id || i.name === auditingProduct.name)
                  const orderedQty = matchingItem ? matchingItem.quantity : 1

                  return (
                    <div key={log.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            log.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            log.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {log.status || 'Pending'}
                          </span>
                          <span className="text-xs font-mono text-gray-500">Tracking: {log.tracking_id}</span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900">Customer: {log.customer_name || 'Guest'}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">Ordered Quantity: <span className="font-bold text-indigo-600">{orderedQty} units</span></p>
                        <span className="text-[11px] text-gray-400 block mt-1">Date: {new Date(log.created_at).toLocaleString()}</span>
                      </div>

                      <div className="text-right text-xs">
                        {log.status === 'Delivered' && <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-lg font-bold border border-green-200 block">✓ Delivered Log</span>}
                        {log.status === 'Cancelled' && (
                          <div>
                            <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-lg font-bold border border-green-200 block mb-1">✕ Cancelled Log</span>
                            {log.cancellation_reason && <span className="text-[11px] text-gray-600 italic block whitespace-normal max-w-xs">{log.cancellation_reason}</span>}
                          </div>
                        )}
                        {log.status !== 'Delivered' && log.status !== 'Cancelled' && (
                          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold border border-green-200 block">Active Order</span>
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
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-sm font-bold text-indigo-900">Product Image Gallery ({activeGalleryIndex + 1} of {activeOrderGalleryImages.length})</h3>
              <button onClick={() => setActiveOrderGalleryImages(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg bg-gray-100 px-3 py-1 rounded-full cursor-pointer">✕</button>
            </div>
            <div className="bg-gray-100 rounded-xl overflow-hidden border h-96 flex items-center justify-center mb-4 relative">
              <img src={activeOrderGalleryImages[activeGalleryIndex]} alt="" className="w-full h-full object-contain p-4" />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 justify-center">
              {activeOrderGalleryImages.map((imgUrl, i) => (
                <button
                  key={i}
                  onClick={() => setActiveGalleryIndex(i)}
                  className={`border-2 rounded-xl overflow-hidden w-20 h-20 flex-shrink-0 transition bg-white ${activeGalleryIndex === i ? 'border-indigo-600 scale-105 shadow-md' : 'border-gray-200 opacity-60'}`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewingProduct && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full">Customer View Preview</span>
              <button onClick={() => setViewingProduct(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="mb-4 bg-gray-100 rounded-xl overflow-hidden border h-80 flex items-center justify-center">
                  <img src={activePreviewImage} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {viewingProduct.image_url ? viewingProduct.image_url.split(',').map((url: string, i: number) => {
                    const cleanUrl = url.trim()
                    return (
                      <button key={i} onClick={() => setActivePreviewImage(cleanUrl)} className={`border-2 rounded-lg overflow-hidden w-16 h-16 flex-shrink-0 transition ${activePreviewImage === cleanUrl ? 'border-indigo-600 scale-105' : 'border-gray-200 opacity-70'}`}>
                        <img src={cleanUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    )
                  }) : null}
                </div>
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">{viewingProduct.category || 'General'}</span>
                  <h1 className="text-2xl font-black text-gray-900 mt-1 mb-2">{viewingProduct.name || viewingProduct.title}</h1>
                  <div className="text-3xl font-extrabold text-indigo-900 mb-4">₹{viewingProduct.price}</div>
                  <div className="mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${viewingProduct.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {viewingProduct.stock > 0 ? `In Stock (${viewingProduct.stock} available)` : 'Out of Stock'}
                    </span>
                  </div>
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-xs font-bold text-gray-700 uppercase mb-2">Product Description</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{viewingProduct.description || 'No description provided.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-lg font-bold text-indigo-900">Edit Product: {editingProduct.name}</h2>
              <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Name</label>
                <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" step="0.01" required value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock</label>
                  <input type="number" required value={editStock} onChange={(e) => setEditStock(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Details / Description</label>
                <textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Image URLs</label>
                {editImageInputs.map((url, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input type="url" value={url} onChange={(e) => handleEditImageInputChange(index, e.target.value)} placeholder="https://example.com/image.jpg" className="w-full border border-gray-300 p-2 rounded-lg text-xs text-gray-900" />
                    {editImageInputs.length > 1 && (
                      <button type="button" onClick={() => handleRemoveEditImageInput(index)} className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold hover:bg-red-100">✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={handleAddEditImageInput} className="mt-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs px-3 py-1.5 rounded-lg transition w-full border border-dashed border-indigo-300">+ Add Another Image URL</button>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setEditingProduct(null)} className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold p-2.5 rounded-lg text-sm transition cursor-pointer">Cancel/Close</button>
                <button type="submit" className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-lg text-sm shadow transition cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}