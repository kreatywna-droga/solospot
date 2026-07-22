'use client'

import { type InputHTMLAttributes, forwardRef } from 'react'
import type { ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, className = '', ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl border bg-[#0a0a0e] text-white placeholder:text-slate-500
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 text-sm
            ${error ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:border-violet-500/50'}
            ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
