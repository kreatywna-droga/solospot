'use client'
import { useState } from 'react'
import { Menu, X, ShoppingBag } from 'lucide-react'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'
import { useCart } from '@/lib/cart/CartStore'

export function NavbarSection({ section, theme, storeName }: SectionComponentProps) {
  const [open, setOpen] = useState(false)
  const config = section.config as { style?: string; sticky?: boolean }
  const { state } = useCart()
  const itemCount = state.itemCount

  return (
    <nav className={`z-40 border-b border-white/10 ${config.sticky ? 'sticky top-0' : ''}`}
      style={{ backgroundColor: theme.primaryColor }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <span className="text-xl font-bold text-white" style={{ fontFamily: theme.font }}>{storeName}</span>
          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm text-white/80 hover:text-white transition-colors">Strona główna</a>
            <a href="#" className="text-sm text-white/80 hover:text-white transition-colors">Produkty</a>
            <a href="#" className="text-sm text-white/80 hover:text-white transition-colors">Kontakt</a>
            <a href={`/store/${storeName.toLowerCase().replace(/\s+/g, '-')}/cart`} className="relative">
              <ShoppingBag className="w-5 h-5 text-white/80 hover:text-white transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </a>
          </div>
          <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/10 px-4 py-4 space-y-3" style={{ backgroundColor: theme.primaryColor }}>
          <a href="#" className="block text-white/80">Strona główna</a>
          <a href="#" className="block text-white/80">Produkty</a>
          <a href="#" className="block text-white/80">Kontakt</a>
          <a href={`/store/${storeName.toLowerCase().replace(/\s+/g, '-')}/cart`} className="block text-white/80">
            Koszyk {itemCount > 0 && `(${itemCount})`}
          </a>
        </div>
      )}
    </nav>
  )
}
