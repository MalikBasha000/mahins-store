// app/product/[slug]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '../../context/CartContext'

export default function ProductDetails() {
  const params = useParams()
  const productId = params.slug as string
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState<number | string>(1)
  const [activeImage, setActiveImage] = useState<string>('')
  
  // Reviews & Purchase Verification State
  const [user, setUser] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [userRating, setUserRating] = useState(5)
  const [userComment, setUserComment] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [hasUserReviewed, setHasUserReviewed] = useState(false)
  const [hasPurchasedProduct, setHasPurchasedProduct] = useState(false)

  const { addToCart } = useCart()
  const supabase = createClient()

  useEffect(() => {
    const getUserAndPurchases = async (prodId: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null
      setUser(currentUser)
      
      if (currentUser) {
        const { data: userOrders } = await supabase
          .from('orders')
          .select('items')
          .eq('user_id', currentUser.id)

        if (userOrders) {
          const purchased = userOrders.some((order: any) => {
            if (!Array.isArray(order.items)) return false
            return order.items.some((item: any) => (item.id || item.product_id) === prodId)
          })
          setHasPurchasedProduct(purchased)
        }
      }
    }

    const getProductAndReviews = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (data) {
        setProduct(data)
        const imgs = data.image_url ? data.image_url.split(',').map((s: string) => s.trim()) : []
        if (imgs.length > 0) setActiveImage(imgs[0])
        getUserAndPurchases(data.id)
      }

      try {
        const revRes = await fetch(`/api/reviews?product_id=${productId}`)
        const revData = await revRes.json()
        if (revData.success) {
          setReviews(revData.reviews)
        }
      } catch (err) {
        console.error('Error fetching reviews:', err)
      }

      setLoading(false)
    }

    if (productId) {
      getProductAndReviews()
    }
  }, [productId, supabase])

  useEffect(() => {
    if (user && reviews.length > 0) {
      setHasUserReviewed(reviews.some(r => r.user_id === user.id))
    }
  }, [user, reviews])

  if (loading) return <div className="p-10 text-center text-xs sm:text-sm text-gray-500">Loading product details...</div>
  if (!product) return <div className="p-10 text-center text-xs sm:text-sm text-gray-500">Product not found.</div>

  const images = product.image_url ? product.image_url.split(',').map((s: string) => s.trim()) : []
  const maxStock = product.stock ?? 999

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      setQuantity('')
      return
    }
    const num = parseInt(val, 10)
    if (!isNaN(num)) {
      if (num <= maxStock) {
        setQuantity(num)
      } else {
        setQuantity(maxStock)
      }
    }
  }

  const handleQuantityBlur = () => {
    if (quantity === '' || Number(quantity) < 1) {
      setQuantity(1)
    }
  }

  const handleAddToCart = () => {
    const finalQty = quantity === '' ? 1 : Number(quantity)
    const qty = finalQty < 1 ? 1 : finalQty
    addToCart({ ...product, price: product.price, image_url: activeImage, stock: maxStock }, qty)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFilePreview(URL.createObjectURL(file))
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Please sign in to leave a review.')
      router.push('/login')
      return
    }
    if (!hasPurchasedProduct) {
      alert('Only customers who have purchased this product can leave a review.')
      return
    }
    if (!userComment.trim()) return

    setSubmittingReview(true)
    try {
      let uploadedImageUrl = null

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(filePath, selectedFile)

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`)
        }

        const { data: publicURLData } = supabase.storage
          .from('review-images')
          .getPublicUrl(filePath)

        uploadedImageUrl = publicURLData.publicUrl
      }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          user_id: user.id,
          customer_name: user.user_metadata?.full_name || 'Verified Buyer',
          rating: userRating,
          comment: userComment.trim(),
          image_url: uploadedImageUrl
        })
      })
      const data = await res.json()
      if (data.success) {
        setUserComment('')
        setSelectedFile(null)
        setFilePreview(null)
        setUserRating(5)
        setHasUserReviewed(true)
        
        const revRes = await fetch(`/api/reviews?product_id=${product.id}`)
        const revData = await revRes.json()
        if (revData.success) setReviews(revData.reviews)
        alert('Review posted successfully!')
      } else {
        alert(data.error || 'Failed to post review.')
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
    setSubmittingReview(false)
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 'No ratings yet'

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full overflow-x-hidden">
      <div className="mx-auto max-w-4xl rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-8 shadow-xs border border-gray-200 w-full">
        <Link href="/" className="inline-flex items-center text-xs sm:text-sm font-semibold text-indigo-600 hover:underline mb-2">
          ← Back to Store
        </Link>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
          {/* Product Media Gallery */}
          <div className="w-full flex flex-col items-center">
            <div className="h-64 sm:h-80 w-full max-w-sm sm:max-w-none bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 flex items-center justify-center mb-3">
              {activeImage ? (
                <img src={activeImage} alt={product.name} className="h-full w-full object-contain p-3" />
              ) : (
                <span className="text-gray-400 text-xs">Image Coming Soon</span>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 w-full max-w-sm sm:max-w-none justify-start no-scrollbar">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden border-2 shrink-0 transition bg-white ${
                      activeImage === img ? 'border-indigo-600 scale-105 shadow-xs' : 'border-gray-200 opacity-60'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="flex flex-col justify-between w-full">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-500">
                {product.category || 'Uncategorized'}
              </span>
              <h1 className="text-xl sm:text-3xl font-black text-gray-900 mt-1 mb-2 leading-tight">
                {product.name}
              </h1>
              <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm leading-relaxed">
                {product.description || 'No description available.'}
              </p>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-900">₹{product.price}</div>
                <div className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  ⭐ {averageRating} {reviews.length > 0 && `(${reviews.length})`}
                </div>
              </div>
              
              <div className="mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
              </div>

              <div className="mb-6 flex items-center gap-3">
                <label htmlFor="quantity" className="text-xs sm:text-sm font-medium text-gray-700">Quantity:</label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  max={maxStock}
                  value={quantity}
                  onChange={handleQuantityChange}
                  onBlur={handleQuantityBlur}
                  className="w-16 sm:w-20 rounded-xl border border-gray-300 px-3 py-2 text-center text-xs sm:text-sm font-bold text-gray-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button 
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-sm text-white hover:bg-indigo-700 transition shadow-xs disabled:opacity-50 cursor-pointer btn-press"
            >
              Add to Cart
            </button>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-8 sm:mt-12 border-t border-gray-200 pt-6 sm:pt-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <h3 className="text-base sm:text-lg font-black text-gray-900">Customer Reviews & Ratings</h3>
            <div className="text-xs sm:text-sm font-bold text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 inline-block w-fit">
              ⭐ {averageRating} {reviews.length > 0 && `(${reviews.length} reviews)`}
            </div>
          </div>

          {/* Review Submission Form with Verification */}
          {!user ? (
            <div className="bg-amber-50 p-4 sm:p-5 rounded-2xl border border-amber-200 text-center text-xs font-bold text-amber-900 mb-6">
              Please <Link href="/login" className="underline text-indigo-600">sign in</Link> and purchase this item to leave a review.
            </div>
          ) : !hasPurchasedProduct ? (
            <div className="bg-amber-50 p-4 sm:p-5 rounded-2xl border border-amber-200 text-center text-xs font-bold text-amber-900 mb-6">
              🔒 Only customers who have purchased this item can leave a review.
            </div>
          ) : hasUserReviewed ? (
            <div className="bg-indigo-50 p-4 sm:p-5 rounded-2xl border border-indigo-200 text-center text-xs font-bold text-indigo-900 mb-6">
              ✓ Thank you! You have already submitted a review for this product. Reviews cannot be edited once posted.
            </div>
          ) : (
            <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 mb-6">
              <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Leave a Verified Purchase Review</h4>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Rating</label>
                  <select 
                    value={userRating} 
                    onChange={(e) => setUserRating(Number(e.target.value))}
                    className="w-full sm:w-auto border border-gray-300 p-2 rounded-xl text-xs bg-white text-gray-900 font-bold focus:outline-indigo-600"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5/5 - Excellent)</option>
                    <option value="4">⭐⭐⭐⭐ (4/5 - Good)</option>
                    <option value="3">⭐⭐⭐ (3/5 - Average)</option>
                    <option value="2">⭐⭐ (2/5 - Poor)</option>
                    <option value="1">⭐ (1/5 - Terrible)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Your Feedback</label>
                  <textarea 
                    rows={3}
                    required
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="Write your experience with this component..."
                    className="w-full border border-gray-300 p-3 rounded-xl text-xs text-gray-900 bg-white focus:outline-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Attach Photo of Purchased Item <span className="text-gray-400">(Optional)</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs px-4 py-2 rounded-xl transition shadow-2xs">
                      + Browse File
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileSelect} 
                        className="hidden" 
                      />
                    </label>
                    {selectedFile && (
                      <span className="text-xs text-indigo-700 font-semibold truncate max-w-xs">
                        📎 {selectedFile.name}
                      </span>
                    )}
                  </div>
                  {filePreview && (
                    <div className="mt-3 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border bg-white p-1 shadow-2xs">
                      <img src={filePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition cursor-pointer btn-press"
                >
                  {submittingReview ? 'Uploading & Posting...' : 'Submit Review ✍️'}
                </button>
              </form>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Be the first to review this product!</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-900">{rev.customer_name}</span>
                    <span className="text-[10px] sm:text-[11px] text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-amber-500 text-xs font-bold">
                    {'⭐'.repeat(rev.rating)}
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>
                  {rev.image_url && (
                    <div className="mt-2 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border bg-gray-50 shadow-2xs">
                      <img src={rev.image_url} alt="Customer purchase" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}