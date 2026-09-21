'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CreditCard, Activity, Menu, X, Zap,
} from 'lucide-react';

import { Logo } from '@/components/ui/Logo';

const navItems = [
  { label: 'Przegląd', href: '/mission-control', icon: LayoutDashboard },
  { label: 'Tenanci', href: '/mission-control/tenants', icon: Users },
  { label: 'Płatności', href: '/mission-control/payments', icon: CreditCard },
  { label: 'Zdarzenia', href: '/mission-control/events', icon: Activity },
];

export default function MissionControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#18181B] text-[#F5F1EA] flex">
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#202024] border-r border-white/10 transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
          <Logo size="sm" />
          <span className="ml-auto text-[10px] font-bold text-[#F2C27F] uppercase tracking-widest bg-[#D9A86C]/15 px-2 py-0.5 rounded-full border border-[#D9A86C]/30">
            MC
          </span>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/mission-control' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#D9A86C]/15 text-[#F2C27F] border border-[#D9A86C]/30 shadow-sm shadow-[#D9A86C]/10 font-semibold'
                    : 'text-[#B8B1A7] hover:text-[#F5F1EA] hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0">
        <header className="h-16 border-b border-white/10 flex items-center px-4 lg:px-8 bg-[#18181B]/80 backdrop-blur-sm sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-[#B8B1A7] hover:text-[#F5F1EA] mr-3"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D9A86C]/15 hover:bg-[#D9A86C]/25 border border-[#D9A86C]/30 text-xs font-semibold rounded-lg text-[#F2C27F] hover:text-[#F6D7AA] transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Powrót do panelu głównego
            </Link>
            <Link
              href="/"
              className="text-xs text-[#77736D] hover:text-[#F5F1EA] transition-colors"
            >
              Strona główna
            </Link>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
