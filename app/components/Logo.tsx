// app/components/Logo.tsx
import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  variant?: 'full' | 'icon'
  size?: number
}

export default function Logo({ className = '', variant = 'full', size = 46 }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon */}
      <div 
        className="relative shrink-0 overflow-hidden rounded-xl bg-white border border-[#8A7968]/20 shadow-2xs" 
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="Mahin's One-Stop One-Store Emblem"
          fill
          sizes={`${size}px`}
          className="object-contain p-1"
          priority
        />
      </div>

      {/* Brand Typography */}
      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <span className="font-black text-base sm:text-lg md:text-xl tracking-tight text-[#2B2B2B]">
            Mahin's
          </span>
          <span className="text-[9px] sm:text-[10px] font-extrabold tracking-wider text-[#8A7968] uppercase mt-0.5">
            One-Stop One-Store
          </span>
        </div>
      )}
    </div>
  )
}