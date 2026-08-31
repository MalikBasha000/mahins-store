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
  
  // Tabs: analytics, upi_verifications, orders, products, customers
  const [activeTab, setActiveTab] = useState<'analytics' | 'upi_verifications' | 'orders' | 'products' | 'customers'>('analytics')
  const [activeAdminOrderTab, setActiveAdminOrderTab] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

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

    // Fetch Products
    const { data: prodData, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (prodErr) setErrorMsg(prodErr.message)
    else setProducts(prodData || [])

    // Fetch Orders
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

    // Fetch Customers if needed
    if (activeTab === 'customers' || activeTab === 'analytics') {
      try {
        const res = await fetch('/api/admin/customers')
        const data = await res.json()
        if (data.success) {
          setCustomers(data.customers || [])
        }
      } catch (err: any) {
        console.error('Failed to load customers:', err)
      }
    }

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
      const reasonInput = prompt('Please enter the reason for admin cancellation:')
      if (reasonInput === null) return
      customReason = `Admin cancelled due to: ${reasonInput.trim() || 'No reason provided'}`
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

  // 12-Digit Numeric ID Generator for Customer and Product Display
  const getTwelveDigitId = (id: string) => {
    if (!id) return '100000000000'
    let hash1 = 5381
    let hash2 = 52711
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i)
      hash1 = (hash1 * 33) ^ char
      hash2 = (hash2 * 33) ^ char
    }
    const combined = Math.abs(hash1).toString().padStart(6, '0') + Math.abs(hash2).toString().padStart(6, '0')
    return combined.slice(0, 12)
  }

  // ----------------- BULK CSV / EXCEL IMPORT & EXPORT UTILITIES -----------------
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

  // Filter pending UPI QR transfers specifically
  const upiPendingOrders = orders.filter(o => {
    const payMethod = (o.payment_method || '').toLowerCase()
    const status = (o.status || '').toLowerCase()
    return payMethod.includes('direct upi') && (status === 'pending verification' || status === 'pending')
  })

  // Filter Customers
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

  // ----------------- ANALYTICS AGGREGATIONS -----------------
  const activeAndDeliveredOrders = orders.filter(o => o.status !== 'Cancelled')
  const totalRevenue = activeAndDeliveredOrders.reduce((acc, o) => acc + Number(o.total_amount || o.final_payable_amount || 0), 0)
  const deliveredRevenue = orders.filter(o => o.status === 'Delivered').reduce((acc, o) => acc + Number(o.total_amount || o.final_payable_amount || 0), 0)
  const averageOrderValue = activeAndDeliveredOrders.length > 0 ? Math.round(totalRevenue / activeAndDeliveredOrders.length) : 0
  const lowStockProducts = products.filter(p => p.stock <= 5)

  // Product sales performance aggregator
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

        {/* Navigation Tabs including UPI Verifications Window */}
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
        </div>

        {/* ----------------- TAB: UPI VERIFICATIONS WINDOW ----------------- */}
        {activeTab === 'upi_verifications' && (
          <div className="bg-white p-6 rounded-2xl shadow-md space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">⚡ Direct UPI / QR Payment Verification Window</h2>
                <p className="text-xs text-gray-500">Cross-check bank statement for UTR and verify customer QR transfers instantly</p>
              </div>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                {upiPendingOrders.length} Pending Approval
              </span>
            </div>

            {upiPendingOrders.length === 0 ? (
              <div className="py-16 text-center bg-gray-50 rounded-2xl border border-gray-200">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm font-bold text-gray-700">All direct UPI payments have been verified!</p>
                <p className="text-xs text-gray-400 mt-1">New QR transfers will appear here instantly when customers check out.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-amber-50/50 text-gray-700 text-xs">
                      <th className="p-3">Tracking ID</th>
                      <th className="p-3">Customer Info</th>
                      <th className="p-3">Payment Details & UTR</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3 text-right">Quick Verify Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upiPendingOrders.map((o) => (
                      <tr key={o.id} className="border-b hover:bg-gray-50 align-top">
                        <td className="p-3 font-mono text-xs font-bold text-indigo-900">{o.tracking_id}</td>
                        <td className="p-3">
                          <div className="font-bold text-gray-900">{o.customer_name}</div>
                          <div className="text-xs text-gray-500">{o.customer_email}</div>
                          <div className="text-[11px] text-gray-400">{o.shipping_address_snapshot?.phone || ''}</div>
                        </td>
                        <td className="p-3">
                          <span className="bg-indigo-50 text-indigo-800 text-xs font-mono font-bold px-2 py-1 rounded border border-indigo-200 inline-block">
                            {o.payment_method}
                          </span>
                        </td>
                        <td className="p-3 font-black text-indigo-900 text-base">₹{o.total_amount || o.final_payable_amount}</td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'Processing')}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition cursor-pointer"
                          >
                            ✓ Verify & Approve Payment
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    <input type="text" list="existing-categories" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Microcontrollers, Sensor" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900" />
                    <datalist id="existing-categories">
                      {categoriesList.map((cat: any, idx: number) => <option key={idx} value={cat} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Product Details / Description</label>
                    <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter full specifications..." className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900" />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-lg text-sm shadow">Add Product</button>
                </form>
              </div>

              <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4">
                  <h2 className="text-lg font-bold text-gray-900">Store Inventory ({filteredProducts.length})</h2>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search name, ID, category..." className="border border-gray-300 p-2 rounded-lg text-xs w-full md:w-48 text-gray-900" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-gray-600 text-xs">
                        <th className="p-3">Product ID & Name</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="border-b hover:bg-gray-50 align-top">
                          <td className="p-3 font-bold text-indigo-600">{p.name}</td>
                          <td className="p-3 font-semibold text-gray-800">₹{p.price}</td>
                          <td className="p-3 font-bold">{p.stock}</td>
                          <td className="p-3 text-right space-x-1">
                            <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 bg-red-50 px-2 py-1.5 rounded text-xs font-bold">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: CUSTOMER ORDERS ----------------- */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Customer Orders ({orders.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600">
                    <th className="p-3">Tracking ID</th>
                    <th className="p-3">Customer & Email</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Status & Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b hover:bg-gray-50 align-top">
                      <td className="p-3 font-mono text-xs font-bold text-indigo-900">{o.tracking_id}</td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-900">{o.customer_name}</div>
                        <div className="text-[11px] text-gray-500">{o.customer_email}</div>
                      </td>
                      <td className="p-3 text-xs font-mono">{o.payment_method}</td>
                      <td className="p-3 font-bold text-indigo-600">₹{o.total_amount || o.final_payable_amount}</td>
                      <td className="p-3 space-y-2">
                        <select
                          value={o.status || 'Pending'}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="border p-1.5 rounded text-xs font-bold bg-white text-indigo-900"
                        >
                          <option value="PENDING VERIFICATION">PENDING VERIFICATION</option>
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------- TAB 3: CUSTOMERS DIRECTORY ----------------- */}
        {activeTab === 'customers' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Registered Customers ({customers.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600 text-xs">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email & Phone</th>
                    <th className="p-3">Orders & Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-bold">{c.name}</td>
                      <td className="p-3 text-xs">{c.email} • {c.phone}</td>
                      <td className="p-3 text-xs">{c.total_orders_count} orders • ₹{c.total_spent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {activePrintOrder && <OrderInvoiceModal order={activePrintOrder.order} type={activePrintOrder.type} onClose={() => setActivePrintOrder(null)} />}
    </div>
  )
}