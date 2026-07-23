import { DocsSidebar } from '@/components/ui/DocsSidebar';
import { getDocsGroupedByCategory } from '@/lib/docs';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const groupedDocs = getDocsGroupedByCategory();

  return (
    <div className="flex flex-col min-h-screen bg-[#050508]">
      {/* Prosty header dla sekcji docs */}
      <header className="sticky top-0 z-40 w-full border-b border-violet-500/20 bg-[#0a0d1a]/80 backdrop-blur-xl">
        <div className="flex h-16 items-center px-6 gap-4">
          <Logo size="sm" />
          <span className="text-sm font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
            Docs
          </span>
        </div>
      </header>

      {/* Kontener główny */}
      <div className="flex flex-1 max-w-[1600px] w-full mx-auto relative h-[calc(100vh-64px)] overflow-hidden">
        {/* Lewy Sidebar */}
        <DocsSidebar groupedDocs={groupedDocs} />
        
        {/* Środkowa zawartość z wbudowanym scrollem */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="mx-auto w-full h-full flex justify-center">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
