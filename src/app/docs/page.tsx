import { getDocsGroupedByCategory } from '@/lib/docs';
import Link from 'next/link';

export default function DocsIndexPage() {
  const groupedDocs = getDocsGroupedByCategory();

  return (
    <div className="w-full max-w-4xl py-12 px-6 lg:px-12">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-4 tracking-tight">
          Dokumentacja SoloSpot
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl">
          Znajdziesz tu wszystkie niezbędne informacje, poradniki i odniesienia API, które pomogą Ci tworzyć i skalować e-commerce nowej generacji.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(groupedDocs).map(([category, docs]) => (
          <div key={category} className="group relative bg-[#0d111d] rounded-2xl border border-violet-500/10 p-6 hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10">
            <h2 className="text-xl font-bold text-slate-200 mb-4">{category}</h2>
            <ul className="space-y-2">
              {docs.slice(0, 4).map(doc => (
                <li key={doc.slug}>
                  <Link href={`/docs/${doc.slug}`} className="text-slate-400 hover:text-violet-400 transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50"></span>
                    {doc.title}
                  </Link>
                </li>
              ))}
              {docs.length > 4 && (
                <li className="pt-2">
                  <span className="text-xs text-slate-500 italic">+ {docs.length - 4} więcej wpisów</span>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
