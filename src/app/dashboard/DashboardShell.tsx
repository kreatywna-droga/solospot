'use client'

import type { ReactNode } from 'react'
import { Store, LayoutDashboard, Settings, Package, LayoutTemplate } from 'lucide-react'
import { Sidebar } from '@/components/ui/Sidebar'

const navItems = [
  { label: 'Panel główny', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Sklepy', href: '/dashboard/stores', icon: <Store className="w-4 h-4" /> },
  { label: 'Produkty', href: '/dashboard/products', icon: <Package className="w-4 h-4" /> },
  { label: 'Szablony', href: '/dashboard/templates', icon: <LayoutTemplate className="w-4 h-4" /> },
  { label: 'Centrum dowodzenia', href: '/mission-control', icon: <Settings className="w-4 h-4" /> },
]

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050508] text-slate-200">
      <Sidebar items={navItems} />
      <div className="lg:pl-64 min-h-screen">
        {children}
      </div>
    </div>
  )
}
