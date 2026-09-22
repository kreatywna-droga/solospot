'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ArrowLeft } from 'lucide-react'
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
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-lg bg-[#202024] border border-white/10 text-[#B8B1A7]"
        aria-label="Otwórz nawigację"
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#202024] border-r border-white/10
          transform transition-transform duration-200 lg:transform-none lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
          ${className} flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <Logo />
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 rounded-lg text-[#B8B1A7] hover:text-[#F5F1EA]"
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
                    ? 'bg-[#D9A86C]/15 text-[#F2C27F] border border-[#D9A86C]/30 shadow-sm shadow-[#D9A86C]/10 font-semibold'
                    : 'text-[#B8B1A7] hover:text-[#F5F1EA] hover:bg-white/5'
                  }`}
              >
                {item.icon && <span className="w-7 h-7">{item.icon}</span>}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Exit back to homepage section */}
        <div className="p-4 border-t border-white/10 mt-auto bg-[#18181B]/60">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-[#D9A86C]/15 border border-white/10 hover:border-[#D9A86C]/30 text-[#B8B1A7] hover:text-[#F5F1EA] text-xs font-semibold rounded-xl transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#77736D] group-hover:text-[#F5F1EA] transition-colors" /> 
            <span>Wyjdź na stronę główną</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
