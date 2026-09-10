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
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  
  // Popup Modal State for Posters
  const [selectedPoster, setSelectedPoster] = useState<any | null>(null)
  
  const [searchInput, setSearchInput] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [categories, setCategories] = useState<string[]>([])

  const router = useRouter()
  const supabase = createClient()
  const { totalItems } = useCart()
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    const getStoreData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null
      setUser(currentUser)

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        setDbError(error.message)
      } else if (data) {
        setProducts(data)
        
        const uniqueCategories = ['All', ...Array.from(new Set(data.map(p => (p.category ? p.category.trim().toLowerCase() : 'uncategorized'))))]
        setCategories(uniqueCategories as string[])
      }

      // Fetch active banners & posters from Supabase
      const { data: bannerData } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (bannerData) {
        const userEmail = (currentUser?.email || '').trim().toLowerCase()
        const relevantBanners = bannerData.filter(b => 
          !b.target_customer_email || b.target_customer_email.toLowerCase() === userEmail
        )
        setBanners(relevantBanners)
      }

      setLoading(false)
    }

    getStoreData()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittedQuery(searchInput.trim())
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSubmittedQuery('')
  }

  const filteredProducts = products.filter((product) => {
    const productCat = product.category ? product.category.trim().toLowerCase() : 'uncategorized'
    const matchesCategory = selectedCategory === 'All' || productCat === selectedCategory
    
    const query = submittedQuery.toLowerCase()
    const matchesSearch = !query || 
      product.name?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      productCat.includes(query)
    
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading Mahin's One-Stop One-Store...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Responsive Header */}
      <header className="bg-white px-4 sm:px-8 lg:px-12 py-3.5 sm:py-5 shadow-xs sticky top-0 z-50 w-full border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 sm:gap-6">
          {/* Brand Logo / Home link */}
          <Link href="/" className="hover:opacity-90 transition cursor-pointer shrink-0">
            <h1 className="text-lg sm:text-2xl font-black text-indigo-900 tracking-tight whitespace-nowrap">
              Mahin's One-Stop One-Store
            </h1>
          </Link>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop Quick Links (Track & Wishlist are also easily accessible via bottom nav on mobile) */}
            <Link href="/track" className="hidden md:flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition border border-indigo-200 whitespace-nowrap">
              📦 Track Order
            </Link>

            <Link href="/wishlist" className="relative flex items-center gap-1.5 rounded-xl bg-pink-50 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-pink-700 hover:bg-pink-100 transition border border-pink-200 whitespace-nowrap">
              ★ <span className="hidden sm:inline">Wishlist</span>
              {wishlist.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-[10px] text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 sm:px-4 sm:py-2 text-indigo-600 text-xs sm:text-sm font-semibold hover:bg-indigo-100 transition border border-indigo-100 whitespace-nowrap">
              🛒 <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-[10px] sm:text-xs text-white font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Auth Controls */}
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 border-l pl-2 sm:pl-4 border-gray-200 shrink-0">
                <span className="text-xs text-gray-600 font-medium hidden xl:inline truncate max-w-[120px]">
                  Hi, {user.user_metadata?.full_name || 'Customer'}
                </span>
                
                <Link href="/orders" className="hidden sm:inline-block rounded-xl bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition hover:bg-green-100 whitespace-nowrap">
                  📦 Orders
                </Link>

                <Link href="/profile" className="rounded-xl bg-indigo-50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 whitespace-nowrap">
                  Profile
                </Link>
                
                <button onClick={handleSignOut} className="rounded-xl bg-gray-100 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 whitespace-nowrap cursor-pointer">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 border-l pl-2 sm:pl-4 border-gray-200 shrink-0 text-xs font-bold text-indigo-600">
                <Link href="/login" className="hover:underline whitespace-nowrap">Sign In</Link>
                <span className="text-gray-300">|</span>
                <Link href="/signup" className="hover:underline whitespace-nowrap hidden sm:inline">Create Account</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 w-full">
        {/* Promotional Banners & Posters */}
        {banners.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
            {banners.map((b) => (
              <div 
                key={b.id} 
                onClick={() => setSelectedPoster(b)}
                className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border bg-white relative group cursor-pointer transition transform hover:scale-[1.01]"
                title="Click to view full poster"
              >
                <div className="w-full bg-gray-900 flex items-center justify-center">
                  <img 
                    src={b.image_url} 
                    alt={b.title} 
                    className="w-full h-auto object-contain max-h-[320px] sm:max-h-[400px]" 
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 sm:p-4 flex items-center justify-between">
                  <h3 className="text-white font-black text-xs sm:text-base tracking-wide truncate">{b.title}</h3>
                  <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur-xs whitespace-nowrap">Zoom 🔍</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Poster Lightbox Popup Modal */}
        {selectedPoster && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-fade-in" onClick={() => setSelectedPoster(null)}>
            <div className="relative max-w-4xl w-full bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-full flex justify-between items-center mb-3 px-2">
                <h3 className="text-sm sm:text-base font-black text-indigo-950 truncate">{selectedPoster.title}</h3>
                <button 
                  onClick={() => setSelectedPoster(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs sm:text-sm px-3 py-1 rounded-full cursor-pointer transition shrink-0 ml-2"
                >
                  ✕ Close
                </button>
              </div>
              <div className="w-full max-h-[75vh] flex items-center justify-center bg-gray-950 rounded-xl sm:rounded-2xl overflow-hidden">
                <img 
                  src={selectedPoster.image_url} 
                  alt={selectedPoster.title} 
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* Search Bar & Dynamic Category Filter Section */}
        <div className="space-y-3 sm:space-y-4 w-full">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full max-w-xl">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search components, sensors..."
                className="w-full border border-gray-300 bg-white px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal shadow-2xs focus:border-indigo-600 focus:outline-hidden pr-8"
              />
              {searchInput && (
                <button type="button" onClick={handleClearSearch} className="absolute right-2.5 top-2.5 text-xs font-bold text-gray-400 hover:text-gray-700">
                  ✕
                </button>
              )}
            </div>
            
            <button type="submit" className="px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition whitespace-nowrap cursor-pointer btn-press shrink-0">
              Search
            </button>
          </form>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 w-full no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer capitalize shrink-0 ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 capitalize">
            {selectedCategory === 'All' ? 'Featured Products' : selectedCategory} ({filteredProducts.length})
            {submittedQuery && (
              <span className="text-xs sm:text-sm font-normal text-gray-500 ml-2">
                matching "{submittedQuery}"
              </span>
            )}
          </h2>
        </div>
        
        {dbError && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700 border border-red-300 text-xs sm:text-sm">
            <strong>Database Error:</strong> {dbError}
          </div>
        )}

        {filteredProducts.length === 0 && !dbError ? (
          <div className="py-12 sm:py-16 text-center bg-white rounded-2xl border border-gray-200 shadow-xs px-4">
            <p className="text-gray-600 font-bold mb-2 text-sm sm:text-base">
              No products found matching "{submittedQuery || selectedCategory}"
            </p>
            <button onClick={() => { handleClearSearch(); setSelectedCategory('All'); }} className="text-xs font-bold text-indigo-600 hover:underline">
              Clear filters and search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full">
            {filteredProducts.map((product) => {
              const firstImage = product.image_url ? product.image_url.split(',')[0].trim() : null
              const inWish = isInWishlist(product.id)

              return (
                <div key={product.id} className="flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-2xs transition hover:shadow-md relative">
                  <button
                    onClick={() => inWish ? removeFromWishlist(product.id) : addToWishlist(product)}
                    className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-xs transition cursor-pointer ${
                      inWish ? 'bg-amber-500 text-white font-black' : 'bg-white/90 text-gray-700 hover:bg-white'
                    }`}
                    title={inWish ? "Remove from Wishlist" : "Save to Wishlist"}
                  >
                    {inWish ? '★' : '☆'}
                  </button>

                  <div className="h-44 sm:h-48 w-full bg-gray-50 flex items-center justify-center overflow-hidden">
                    {firstImage ? (
                      <img src={firstImage} alt={product.name} className="h-full w-full object-contain p-3" />
                    ) : (
                      <span className="text-gray-400 text-xs">Image Coming Soon</span>
                    )}
                  </div>
                  
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <span className="mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-500">
                      {product.category || 'Uncategorized'}
                    </span>
                    <h3 className="mb-1.5 text-base sm:text-lg font-bold text-gray-900 leading-tight line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="mb-4 flex-1 text-xs sm:text-sm text-gray-600 line-clamp-2">
                      {product.description || 'No description available.'}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <span className="text-lg sm:text-xl font-extrabold text-gray-900">
                        ₹{product.price}
                      </span>
                      <Link href={`/product/${product.id}`} className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-indigo-700 btn-press">
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