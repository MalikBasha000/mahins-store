// app/components/Logo.tsx
import React from 'react'

interface LogoProps {
  className?: string
  variant?: 'full' | 'icon'
  size?: number
}

export default function Logo({ className = '', variant = 'full', size = 40 }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Brand Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D98A95" />
            <stop offset="100%" stopColor="#B76E79" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2B2B2B" />
            <stop offset="100%" stopColor="#4A3F35" />
          </linearGradient>
        </defs>

        {/* Outer Isometric Hexagon / Tech Shield */}
        <polygon
          points="50,6 88,27 88,73 50,94 12,73 12,27"
          fill="none"
          stroke="url(#roseGradient)"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Inner Isometric Box Faces */}
        {/* Top Plane */}
        <polygon
          points="50,18 76,33 50,48 24,33"
          fill="#EFE3D3"
          stroke="#8A7968"
          strokeWidth="2"
          opacity="0.9"
        />
        {/* Left Plane */}
        <polygon
          points="24,35 50,50 50,80 24,65"
          fill="#B76E79"
          opacity="0.85"
        />
        {/* Right Plane */}
        <polygon
          points="50,50 76,35 76,65 50,80"
          fill="#9E5B65"
        />

        {/* Center Circuit Chip & Traces */}
        <circle cx="50" cy="50" r="7" fill="#F4EADE" stroke="#2B2B2B" strokeWidth="3" />
        
        {/* Circuit Branch Pins */}
        <line x1="50" y1="18" x2="50" y2="43" stroke="#B76E79" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="18" r="3" fill="#B76E79" />

        <line x1="24" y1="65" x2="44" y2="54" stroke="#F4EADE" strokeWidth="3" strokeLinecap="round" />
        <circle cx="24" cy="65" r="3" fill="#F4EADE" />

        <line x1="76" y1="65" x2="56" y2="54" stroke="#F4EADE" strokeWidth="3" strokeLinecap="round" />
        <circle cx="76" cy="65" r="3" fill="#F4EADE" />
      </svg>

      {/* Brand Typography */}
      {variant === 'full' && (
        <div className="flex flex-col leading-none select-none">
          <div className="flex items-center gap-1">
            <span className="font-black text-lg sm:text-xl tracking-tight text-[#2B2B2B]">
              Mahin's
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B76E79]" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-extrabold tracking-[0.2em] text-[#8A7968] uppercase mt-0.5">
            One-Stop One-Store
          </span>
        </div>
      )}
    </div>
  )
}