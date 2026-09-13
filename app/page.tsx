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
    return <div className="flex min-h-screen items-center justify-center bg-[#F4EADE] text-[#8A7968] font-bold">Loading Mahin's One-Stop One-Store...</div>
  }

  return (
    <div className="min-h-screen bg-[#F4EADE] text-[#2B2B2B] w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-[#EFE3D3] px-3 sm:px-8 lg:px-12 py-3.5 sm:py-5 shadow-xs sticky top-0 z-50 w-full border-b border-[#8A7968]/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          {/* Brand Logo */}
          <Link href="/" className="hover:opacity-90 transition cursor-pointer min-w-0 shrink">
            <h1 className="text-sm sm:text-xl md:text-2xl font-black text-[#2B2B2B] tracking-tight truncate">
              Mahin's One-Stop One-Store
            </h1>
          </Link>

          {/* Action Navigation Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Desktop Only: Order Tracking */}
            <Link
              href="/track"
              className="hidden md:flex items-center gap-1.5 rounded-xl bg-[#F4EADE] px-3.5 py-2 text-xs font-bold text-[#2B2B2B] hover:bg-[#EADBC8] transition border border-[#8A7968]/30"
            >
              📦 Track Order
            </Link>

            {/* Wishlist Pill */}
            <Link
              href="/wishlist"
              className="relative flex items-center gap-1 rounded-xl bg-[#B76E79]/15 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-[#B76E79] hover:bg-[#B76E79]/25 transition border border-[#B76E79]/40"
            >
              <span>★</span>
              <span className="hidden sm:inline">Wishlist</span>
              {wishlist.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#B76E79] text-[10px] text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Desktop Only: Cart Pill */}
            <Link
              href="/cart"
              className="hidden sm:flex relative items-center gap-1.5 rounded-xl bg-[#F4EADE] px-3.5 py-2 text-[#2B2B2B] text-xs sm:text-sm font-semibold hover:bg-[#EADBC8] transition border border-[#8A7968]/30"
            >
              <span>🛒</span>
              <span>Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#B76E79] text-xs text-white font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Auth Controls */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-3 border-l pl-2 sm:pl-4 border-[#8A7968]/30">
                {/* Your Orders Button */}
                <Link
                  href="/orders"
                  className="rounded-xl bg-[#F4EADE] px-2.5 py-1.5 text-xs font-bold text-[#2B2B2B] transition hover:bg-[#EADBC8] border border-[#8A7968]/30 flex items-center gap-1"
                >
                  <span>📋</span>
                  <span>Orders</span>
                </Link>

                <Link
                  href="/profile"
                  className="rounded-xl bg-[#F4EADE] px-2.5 py-1.5 text-xs font-bold text-[#2B2B2B] transition hover:bg-[#EADBC8] border border-[#8A7968]/30"
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="rounded-xl bg-[#EADBC8] px-2.5 py-1.5 text-xs font-bold text-[#2B2B2B] transition hover:bg-[#8A7968]/30 cursor-pointer hidden sm:inline-block border border-[#8A7968]/30"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-3 border-l pl-2 sm:pl-4 border-[#8A7968]/30 text-xs font-bold text-[#B76E79]">
                <Link href="/login" className="hover:underline py-1">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8 pt-6 sm:pt-8 pb-28 sm:pb-12 space-y-6 sm:space-y-8 w-full">
        {/* Promotional Banners & Posters */}
        {banners.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
            {banners.map((b) => (
              <div 
                key={b.id} 
                onClick={() => setSelectedPoster(b)}
                className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-[#8A7968]/40 bg-[#EFE3D3] relative group cursor-pointer transition transform hover:scale-[1.01] h-64 sm:h-80"
                title="Click to view full poster"
              >
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={b.image_url} 
                    alt={b.title} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2B2B2B]/95 via-[#2B2B2B]/60 to-transparent p-3 sm:p-4 flex items-center justify-between">
                  <h3 className="text-[#F4EADE] font-black text-xs sm:text-base tracking-wide truncate">{b.title}</h3>
                  <span className="text-[10px] font-bold bg-[#B76E79] text-white px-2.5 py-1 rounded-full whitespace-nowrap">Zoom 🔍</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Poster Lightbox Popup Modal */}
        {selectedPoster && (
          <div className="fixed inset-0 bg-[#2B2B2B]/85 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-fade-in" onClick={() => setSelectedPoster(null)}>
            <div className="relative max-w-4xl w-full bg-[#EFE3D3] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col items-center border border-[#8A7968]/40" onClick={(e) => e.stopPropagation()}>
              <div className="w-full flex justify-between items-center mb-3 px-2">
                <h3 className="text-sm sm:text-base font-black text-[#2B2B2B] truncate">{selectedPoster.title}</h3>
                <button 
                  onClick={() => setSelectedPoster(null)}
                  className="bg-[#EADBC8] hover:bg-[#8A7968]/30 text-[#2B2B2B] font-extrabold text-xs sm:text-sm px-3 py-1 rounded-full cursor-pointer transition shrink-0 ml-2 border border-[#8A7968]/30"
                >
                  ✕ Close
                </button>
              </div>
              <div className="w-full max-h-[75vh] flex items-center justify-center bg-[#EFE3D3] rounded-xl sm:rounded-2xl overflow-hidden">
                <img 
                  src={selectedPoster.image_url} 
                  alt={selectedPoster.title} 
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* Search Bar & Category Filter Section */}
        <div className="space-y-3 sm:space-y-4 w-full">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full max-w-xl">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search components, sensors..."
                className="w-full border border-[#8A7968]/40 bg-[#EFE3D3] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#2B2B2B] placeholder:text-[#8A7968] placeholder:font-normal shadow-2xs focus:border-[#B76E79] focus:outline-hidden pr-8"
              />
              {searchInput && (
                <button type="button" onClick={handleClearSearch} className="absolute right-2.5 top-2.5 text-xs font-bold text-[#8A7968] hover:text-[#2B2B2B]">
                  ✕
                </button>
              )}
            </div>
            
            <button type="submit" className="px-4 sm:px-5 py-2.5 bg-[#B76E79] hover:bg-[#9E5B65] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition whitespace-nowrap cursor-pointer btn-press shrink-0">
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
                    ? 'bg-[#B76E79] text-white shadow-xs' 
                    : 'bg-[#EFE3D3] text-[#2B2B2B] border border-[#8A7968]/30 hover:bg-[#EADBC8]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-bold text-[#2B2B2B] capitalize">
            {selectedCategory === 'All' ? 'Featured Products' : selectedCategory} ({filteredProducts.length})
            {submittedQuery && (
              <span className="text-xs sm:text-sm font-normal text-[#8A7968] ml-2">
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
          <div className="py-12 sm:py-16 text-center bg-[#EFE3D3] rounded-2xl border border-[#8A7968]/30 shadow-xs px-4">
            <p className="text-[#2B2B2B] font-bold mb-2 text-sm sm:text-base">
              No products found matching "{submittedQuery || selectedCategory}"
            </p>
            <button onClick={() => { handleClearSearch(); setSelectedCategory('All'); }} className="text-xs font-bold text-[#B76E79] hover:underline">
              Clear filters and search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full">
            {filteredProducts.map((product) => {
              const firstImage = product.image_url ? product.image_url.split(',')[0].trim() : null
              const inWish = isInWishlist(product.id)

              return (
                <div key={product.id} className="flex flex-col overflow-hidden rounded-2xl bg-[#EFE3D3] border border-[#8A7968]/30 shadow-2xs transition hover:shadow-md relative">
                  <button
                    onClick={() => inWish ? removeFromWishlist(product.id) : addToWishlist(product)}
                    className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-xs transition cursor-pointer ${
                      inWish ? 'bg-[#B76E79] text-white font-black' : 'bg-[#EADBC8] text-[#2B2B2B] hover:bg-[#8A7968]/30'
                    }`}
                    title={inWish ? "Remove from Wishlist" : "Save to Wishlist"}
                  >
                    {inWish ? '★' : '☆'}
                  </button>

                  <div className="h-44 sm:h-48 w-full bg-[#EADBC8]/50 flex items-center justify-center overflow-hidden border-b border-[#8A7968]/20">
                    {firstImage ? (
                      <img src={firstImage} alt={product.name} className="h-full w-full object-contain p-3" />
                    ) : (
                      <span className="text-[#8A7968] text-xs">Image Coming Soon</span>
                    )}
                  </div>
                  
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <span className="mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8A7968]">
                      {product.category || 'Uncategorized'}
                    </span>
                    <h3 className="mb-1.5 text-base sm:text-lg font-bold text-[#2B2B2B] leading-tight line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="mb-4 flex-1 text-xs sm:text-sm text-[#8A7968] line-clamp-2">
                      {product.description || 'No description available.'}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <span className="text-lg sm:text-xl font-extrabold text-[#2B2B2B]">
                        ₹{product.price}
                      </span>
                      <Link href={`/product/${product.id}`} className="rounded-xl bg-[#B76E79] hover:bg-[#9E5B65] px-3.5 py-2 text-xs sm:text-sm font-semibold text-white transition btn-press">
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