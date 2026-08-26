// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from './context/CartContext'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { totalItems } = useCart()

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
      }
      setLoading(false)
    }

    getUser()
    getProducts()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading Mahin's One-Stop One-Store...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white px-8 py-6 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-3xl font-extrabold text-indigo-900">
            Mahin's One-Stop One-Store
          </h1>
          
          <div className="flex items-center gap-4">
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
                <span className="text-sm text-gray-600 font-medium">
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
        <h2 className="mb-8 text-2xl font-bold text-gray-800">Featured Products</h2>
        
        {dbError && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700 border border-red-300">
            <strong>Database Error:</strong> {dbError}
          </div>
        )}

        {products.length === 0 && !dbError ? (
          <p className="text-gray-500">No products found in the store.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const firstImage = product.image_url ? product.image_url.split(',')[0].trim() : null

              return (
                <div key={product.id} className="flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition hover:shadow-lg">
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
                    <h3 className="mb-2 text-lg font-bold text-gray-900 leading-tight">
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