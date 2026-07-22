'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Logo } from './Logo'

interface NavItem {
  label: string
  href: string
  icon?: ReactNode
}

interface SidebarProps {
  items: NavItem[]
  brand?: string
  className?: string
}

export function Sidebar({ items, brand, className = '' }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-lg bg-[#080a12] border border-white/10 text-slate-400"
        aria-label="Otwórz nawigację"
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#080a12] border-r border-white/5
          transform transition-transform duration-200 lg:transform-none lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
          ${className}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <Logo />
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white"
            aria-label="Zamknij nawigację"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
