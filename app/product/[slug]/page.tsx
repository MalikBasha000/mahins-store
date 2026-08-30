// app/product/[slug]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '../../context/CartContext'

export default function ProductDetails() {
  const params = useParams()
  const productId = params.slug as string // This holds your product UUID now
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState<number | string>(1)
  const [activeImage, setActiveImage] = useState<string>('')
  const { addToCart } = useCart()
  const supabase = createClient()

  useEffect(() => {
    const getProduct = async () => {
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
      setLoading(false)
    }
    if (productId) {
      getProduct()
    }
  }, [productId])

  if (loading) return <div className="p-10 text-center text-gray-500">Loading product details...</div>
  if (!product) return <div className="p-10 text-center text-gray-500">Product not found.</div>

  const images = product.image_url ? product.image_url.split(',').map((s: string) => s.trim()) : []
  const maxStock = product.stock ?? 999

  // Handle quantity typing allowing a temporary empty string
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

  // Fallback to 1 if left completely blank on blur
  const handleQuantityBlur = () => {
    if (quantity === '' || Number(quantity) < 1) {
      setQuantity(1)
    }
  }

  const handleAddToCart = () => {
    const finalQty = quantity === '' ? 1 : Number(quantity)
    const qty = finalQty < 1 ? 1 : finalQty
    // Pass product with correct price and image fields to cart context
    addToCart({ ...product, price: product.price, image_url: activeImage, stock: maxStock }, qty)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-md">
        <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline">← Back to Store</Link>
        
        <div className="mt-6 grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <div className="h-80 w-full bg-gray-100 rounded-xl overflow-hidden border flex items-center justify-center mb-4">
              {activeImage ? (
                <img src={activeImage} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-gray-400">Image Coming Soon</span>
              )}
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`h-16 w-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${activeImage === img ? 'border-indigo-600 scale-105' : 'border-gray-200 opacity-70'}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">{product.category || 'Uncategorized'}</span>
              <h1 className="text-3xl font-black text-gray-900 mt-1 mb-2">{product.name}</h1>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">{product.description || 'No description available.'}</p>
              <div className="text-3xl font-extrabold text-indigo-900 mb-6">₹{product.price}</div>
              
              <div className="mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
              </div>

              {/* Quantity Input Box */}
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
      </div>
    </div>
  )
}