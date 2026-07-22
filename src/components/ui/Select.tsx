'use client'

import { type SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`w-full rounded-xl border bg-[#0a0a0e] text-white placeholder:text-slate-500
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50
            px-4 py-2.5 text-sm appearance-none cursor-pointer
            ${error ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:border-violet-500/50'}
            ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#0a0a0e]">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
