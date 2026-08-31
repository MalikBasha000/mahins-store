// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from './context/CartContext'
import { useWishlist } from './context/WishlistContext'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [categories, setCategories] = useState<string[]>([])

  const router = useRouter()
  const supabase = createClient()
  const { totalItems } = useCart()
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }

    const getProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        setDbError(error.message)
      } else if (data) {
        setProducts(data)
        const uniqueCategories = ['All', ...Array.from(new Set(data.map(p => p.category || 'Uncategorized')))]
        setCategories(uniqueCategories as string[])
      }
      setLoading(false)
    }

    getUser()
    getProducts()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  // Filter products based on search query and category
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || (product.category || 'Uncategorized') === selectedCategory
    const query = searchQuery.toLowerCase()
    const matchesSearch = 
      product.name?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query)
    
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading Mahin's One-Stop One-Store...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white px-8 py-6 shadow-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-900 truncate">
            Mahin's One-Stop One-Store
          </h1>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Link href="/wishlist" className="relative flex items-center gap-1.5 rounded-lg bg-pink-50 px-3 py-2 text-xs font-bold text-pink-700 hover:bg-pink-100 transition border border-pink-200">
              🔖 Wishlist
              {wishlist.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-[10px] text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-indigo-600 font-semibold hover:bg-indigo-100 transition">
              🛒 Cart
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
                <span className="text-sm text-gray-600 font-medium hidden md:inline">
                  Hi, {user.user_metadata?.full_name || 'Customer'}
                </span>
                
                <Link 
                  href="/orders" 
                  className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                >
                  📦 Your Orders
                </Link>

                <Link 
                  href="/profile" 
                  className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  Your Profile
                </Link>
                
                <button 
                  onClick={handleSignOut}
                  className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-3 border-l pl-4 border-gray-200">
                <Link href="/login" className="font-medium text-indigo-600 hover:underline">Sign In</Link>
                <span className="text-gray-300">|</span>
                <Link href="/signup" className="font-medium text-indigo-600 hover:underline">Create Account</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-8">
        {/* Search Bar & Category Filter Section */}
        <div className="mb-6 space-y-4">
          {/* Smaller, Compact Search Input */}
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components, sensors, gifts..."
              className="w-full border border-gray-300 bg-white px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal shadow-sm focus:border-indigo-600 focus:outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs font-bold text-gray-500 hover:text-gray-800"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedCategory === 'All' ? 'Featured Products' : selectedCategory} ({filteredProducts.length})
          </h2>
        </div>
        
        {dbError && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700 border border-red-300">
            <strong>Database Error:</strong> {dbError}
          </div>
        )}

        {filteredProducts.length === 0 && !dbError ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-gray-600 font-bold mb-2">No products found matching "{searchQuery}"</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} className="text-xs font-bold text-indigo-600 hover:underline">
              Clear filters and search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const firstImage = product.image_url ? product.image_url.split(',')[0].trim() : null
              const inWish = isInWishlist(product.id)

              return (
                <div key={product.id} className="flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition hover:shadow-lg relative">
                  {/* Wishlist Bookmark Button */}
                  <button
                    onClick={() => inWish ? removeFromWishlist(product.id) : addToWishlist(product)}
                    className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs shadow transition cursor-pointer ${
                      inWish ? 'bg-indigo-600 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'
                    }`}
                    title={inWish ? "Remove from Wishlist" : "Save to Wishlist"}
                  >
                    {inWish ? '🔖' : '📑'}
                  </button>

                  <div className="h-48 w-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {firstImage ? (
                      <img src={firstImage} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-xs">Image Coming Soon</span>
                    )}
                  </div>
                  
                  <div className="flex flex-1 flex-col p-5">
                    <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-500">
                      {product.category || 'Uncategorized'}
                    </span>
                    <h3 className="mb-2 text-lg font-bold text-gray-900 leading-tight line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="mb-4 flex-1 text-sm text-gray-600 line-clamp-2">
                      {product.description || 'No description available.'}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-xl font-extrabold text-gray-900">
                        ₹{product.price}
                      </span>
                      <Link 
                        href={`/product/${product.id}`}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}