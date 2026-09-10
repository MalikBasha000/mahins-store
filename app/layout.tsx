// app/layout.tsx
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { CartProvider } from "./context/CartContext"
import { WishlistProvider } from "./context/WishlistContext"
import MobileBottomNav from "./components/MobileBottomNav"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mahin's One-Stop One-Store",
  description: "Your go-to store for electronics, robotics, and gifts",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="w-full overflow-x-hidden">
      <body className={`${inter.className} w-full min-h-screen overflow-x-hidden bg-white text-gray-900 pb-16 sm:pb-0 antialiased`}>
        <CartProvider>
          <WishlistProvider>
            <div className="w-full max-w-full flex flex-col min-h-screen">
              {children}
            </div>
            <MobileBottomNav />
          </WishlistProvider>
        </CartProvider>

        {/* Razorpay Checkout Script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}