'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DocMeta } from '@/lib/docs';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface DocsSidebarProps {
  groupedDocs: Record<string, DocMeta[]>;
}

export function DocsSidebar({ groupedDocs }: DocsSidebarProps) {
  const pathname = usePathname();
  
  return (
    <div className="flex flex-col w-full max-w-[280px] shrink-0 border-r border-violet-500/10 bg-[#0a0d1a]/50 h-full overflow-y-auto py-8 pr-6 hidden md:block">
      <nav className="flex flex-col gap-8">
        {Object.entries(groupedDocs).map(([category, docs]) => (
          <div key={category} className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-400">
              {category}
            </h4>
            <div className="flex flex-col gap-1">
              {docs.map((doc) => {
                const isActive = pathname === `/docs/${doc.slug}`;
                return (
                  <Link
                    key={doc.slug}
                    href={`/docs/${doc.slug}`}
                    className={`group flex items-center justify-between py-1.5 px-3 rounded-lg text-sm transition-all duration-200 ${
                      isActive 
                        ? "bg-violet-600/10 text-violet-300 font-medium border border-violet-500/20" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                    }`}
                  >
                    {doc.title}
                    <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${
                      isActive ? "text-violet-400 opacity-100 translate-x-0.5" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                    }`} />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Przycisk powrotu na dół */}
      <div className="mt-auto pt-8">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/20 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 group-hover:text-white transition-colors"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          <span>Wróć na stronę główną</span>
        </Link>
      </div>
    </div>
  );
}
