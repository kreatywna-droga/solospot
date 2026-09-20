'use client'

import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#D9A86C] via-[#F2C27F] to-[#D9A86C] text-[#080B10] font-bold shadow-md shadow-[#D9A86C]/20 hover:shadow-lg hover:shadow-[#D9A86C]/30 hover:scale-105 active:scale-95',
  secondary:
    'border border-white/10 bg-white/5 text-[#F5F1EA] hover:bg-white/10 hover:border-white/20 active:scale-95',
  outline:
    'border border-[#D9A86C]/40 text-[#F2C27F] hover:bg-[#D9A86C]/10 hover:border-[#D9A86C]/60 active:scale-95',
  ghost:
    'text-[#B8B1A7] hover:text-[#F5F1EA] hover:bg-white/5 active:scale-95',
  danger:
    'bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-base gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center rounded-full font-semibold
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D9A86C]/50
          disabled:opacity-50 disabled:pointer-events-none disabled:scale-100
          ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
