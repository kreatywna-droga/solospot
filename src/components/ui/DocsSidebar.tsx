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
    <div className="w-full max-w-[280px] shrink-0 border-r border-violet-500/10 bg-[#0a0d1a]/50 h-full overflow-y-auto py-8 pr-6 hidden md:block">
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
    </div>
  );
}
