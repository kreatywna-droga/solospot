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
    <div className="min-h-screen bg-[#050508] text-slate-200 flex">
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#080a12] border-r border-white/5 transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
          <Logo size="sm" />
          <span className="ml-auto text-[10px] font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
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
                    ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0">
        <header className="h-16 border-b border-white/5 flex items-center px-4 lg:px-8 bg-[#050508]/80 backdrop-blur-sm sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-400 hover:text-white mr-3"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <a
              href="/"
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              Powrót do strony głównej
            </a>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
