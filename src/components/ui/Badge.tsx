import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  variant?: BadgeVariant
  dot?: boolean
  children: ReactNode
  className?: string
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-sky-400',
}

const badgeStyles: Record<BadgeVariant, string> = {
  default: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  danger: 'border-red-500/30 bg-red-500/10 text-red-300',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
}

export function Badge({ variant = 'default', dot, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${badgeStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  )
}
