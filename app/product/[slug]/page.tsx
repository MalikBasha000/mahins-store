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
  
  // Reviews State
  const [user, setUser] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [userRating, setUserRating] = useState(5)
  const [userComment, setUserComment] = useState('')
  const [userPhotoUrl, setUserPhotoUrl] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [hasUserReviewed, setHasUserReviewed] = useState(false)

  const { addToCart } = useCart()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null
      setUser(currentUser)
      
      if (currentUser && reviews.length > 0) {
        setHasUserReviewed(reviews.some(r => r.user_id === currentUser.id))
      }
    }

    const getProductAndReviews = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (data) {
        setProduct(data)
        const imgs = data.image_url ? data.image_url.split(',').map((s: string) => s.trim()) : []
        if (imgs.length > 0) setActiveImage(imgs[0])
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

    getUser()
    if (productId) {
      getProductAndReviews()
    }
  }, [productId, supabase])

  useEffect(() => {
    if (user && reviews.length > 0) {
      setHasUserReviewed(reviews.some(r => r.user_id === user.id))
    }
  }, [user, reviews])

  if (loading) return <div className="p-10 text-center text-gray-500">Loading product details...</div>
  if (!product) return <div className="p-10 text-center text-gray-500">Product not found.</div>

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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Please sign in to leave a review.')
      router.push('/login')
      return
    }
    if (!userComment.trim()) return

    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          user_id: user.id,
          customer_name: user.user_metadata?.full_name || 'Verified Customer',
          rating: userRating,
          comment: userComment.trim(),
          image_url: userPhotoUrl.trim() || null
        })
      })
      const data = await res.json()
      if (data.success) {
        setUserComment('')
        setUserPhotoUrl('')
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-md">
        <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline">← Back to Store</Link>
        
        <div className="mt-6 grid md:grid-cols-2 gap-8">
          <div>
            <div className="h-80 w-full bg-gray-50 rounded-xl overflow-hidden border flex items-center justify-center mb-4">
              {activeImage ? (
                <img src={activeImage} alt={product.name} className="h-full w-full object-contain p-2" />
              ) : (
                <span className="text-gray-400">Image Coming Soon</span>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`h-16 w-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition bg-white ${activeImage === img ? 'border-indigo-600 scale-105' : 'border-gray-200 opacity-70'}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">{product.category || 'Uncategorized'}</span>
              <h1 className="text-3xl font-black text-gray-900 mt-1 mb-2">{product.name}</h1>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">{product.description || 'No description available.'}</p>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl font-extrabold text-indigo-900">₹{product.price}</div>
                <div className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  ⭐ {averageRating} {reviews.length > 0 && `(${reviews.length})`}
                </div>
              </div>
              
              <div className="mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
              </div>

              <div className="mb-6 flex items-center gap-4">
                <label htmlFor="quantity" className="text-sm font-medium text-gray-700">Quantity:</label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  max={maxStock}
                  value={quantity}
                  onChange={handleQuantityChange}
                  onBlur={handleQuantityBlur}
                  className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              Add to Cart
            </button>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-12 border-t pt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-900">Customer Reviews & Ratings</h3>
            <div className="text-sm font-bold text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              ⭐ {averageRating} {reviews.length > 0 && `(${reviews.length} reviews)`}
            </div>
          </div>

          {/* Review Submission Form (Locked if already reviewed) */}
          {hasUserReviewed ? (
            <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-200 text-center text-xs font-bold text-indigo-900 mb-8">
              ✓ Thank you! You have already submitted a review for this product. Reviews cannot be edited once posted.
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-8">
              <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Leave a Review</h4>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Rating</label>
                  <select 
                    value={userRating} 
                    onChange={(e) => setUserRating(Number(e.target.value))}
                    className="border border-gray-300 p-2 rounded-xl text-xs bg-white text-gray-900 font-bold focus:outline-indigo-600"
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Attach Photo of Purchased Item <span className="text-gray-400">(Optional Image URL)</span></label>
                  <input 
                    type="url"
                    value={userPhotoUrl}
                    onChange={(e) => setUserPhotoUrl(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs text-gray-900 bg-white focus:outline-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow transition cursor-pointer"
                >
                  {submittingReview ? 'Posting Review...' : 'Submit Review ✍️'}
                </button>
              </form>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Be the first to review this product!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-900">{rev.customer_name}</span>
                    <span className="text-[11px] text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-amber-500 text-xs font-bold">
                    {'⭐'.repeat(rev.rating)}
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>
                  {rev.image_url && (
                    <div className="mt-2 w-28 h-28 rounded-xl overflow-hidden border bg-gray-50">
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