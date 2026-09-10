// app/layout.tsx
import type { Metadata } from "next"
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} pb-16 sm:pb-0`}>
        <CartProvider>
          <WishlistProvider>
            {children}
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