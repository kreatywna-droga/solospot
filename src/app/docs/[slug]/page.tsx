import { getAllDocs, getDocBySlug } from '@/lib/docs';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { TableOfContents } from '@/components/ui/TableOfContents';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  const docs = getAllDocs();
  return docs.map((doc) => ({
    slug: doc.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const doc = getDocBySlug(resolvedParams.slug);
  
  if (!doc) {
    return {
      title: 'Nie znaleziono | SoloSpot Docs',
    };
  }

  return {
    title: `${doc.title} | SoloSpot Docs`,
    description: doc.description,
  };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const doc = getDocBySlug(resolvedParams.slug);

  if (!doc) {
    notFound();
  }

  return (
    <div className="flex w-full h-full max-w-[1200px] mx-auto">
      {/* Kolumna główna z treścią */}
      <div className="flex-1 min-w-0 max-w-[800px] py-12 px-6 lg:px-12 w-full">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href="/docs" className="hover:text-violet-400 transition-colors">Docs</Link>
          <ChevronRight className="w-3 h-3" />
          <span>{doc.category}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-300">{doc.title}</span>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight mb-4">{doc.title}</h1>
          {doc.description && (
            <p className="text-lg text-slate-400">{doc.description}</p>
          )}
        </div>

        {/* 
          Używamy prose i prose-invert z Tailwind Typography
          Konfiguracja kolorów accentowych jest nadpisana przez markery prose-violet 
        */}
        <div className="prose prose-invert prose-violet max-w-none 
          prose-headings:text-slate-200 prose-headings:font-bold 
          prose-a:text-violet-400 hover:prose-a:text-violet-300 prose-a:no-underline hover:prose-a:underline
          prose-code:text-violet-300 prose-code:bg-violet-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-[#0a0d1a] prose-pre:border prose-pre:border-violet-500/20 prose-pre:shadow-lg
          prose-strong:text-slate-200
          prose-blockquote:border-l-violet-500 prose-blockquote:bg-violet-500/5 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
          prose-img:rounded-xl prose-img:border prose-img:border-violet-500/10
          ">
          <ReactMarkdown>{doc.content}</ReactMarkdown>
        </div>
        
        <div className="mt-20 pt-8 border-t border-violet-500/20 text-sm text-slate-500 flex justify-between">
          <p>Ostatnia aktualizacja: Zawsze świeże</p>
          <p>Kategoria: {doc.category}</p>
        </div>
      </div>

      {/* Prawa kolumna (Spis treści) */}
      <TableOfContents content={doc.content} />
    </div>
  );
}
