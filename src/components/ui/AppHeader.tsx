'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from './Logo'
import { Button } from './Button'

interface AppHeaderProps {
  backHref?: string
  backLabel?: string
  actions?: ReactNode
  className?: string
}

export function AppHeader({ backHref, backLabel, actions, className = '' }: AppHeaderProps) {
  return (
    <header className={`sticky top-0 z-30 border-b border-white/5 bg-[#050508]/80 backdrop-blur-xl ${className}`}>
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <Logo />
          </div>
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLabel || 'Powrót'}
            </Link>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
