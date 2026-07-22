import { BookOpen, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/blogData';

export default function BlogPage() {
  const blogPosts = getBlogPosts();
  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white selection:bg-purple-500/30">
      <nav className="relative z-50 px-6 lg:px-12 py-8 max-w-[1200px] mx-auto border-b border-white/5">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" /> Wróć na stronę główną
        </Link>
      </nav>

      {/* Hero */}
      <header className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-serif">Blog i Porady</h1>
          <p className="text-lg md:text-xl text-slate-400">
            Profesjonalna wiedza na temat snu, neurobiologii dziecięcej oraz porady dla rodziców, jak zbudować idealne środowisko do usypiania.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        
        {/* Lista wpisów */}
        <div className="space-y-12">
          {blogPosts.map((post, idx) => (
            <Link href={`/na-dobranoc/blog/${post.slug}`} key={idx} className="block group">
              <article className="flex flex-col md:flex-row gap-8 items-center bg-[#111118] border border-white/5 rounded-3xl overflow-hidden hover:border-purple-500/30 hover:bg-white/[0.02] transition-all cursor-pointer p-2 shadow-lg">
                <div className={`w-full md:w-80 h-64 md:h-full rounded-2xl ${post.image} flex items-center justify-center border border-white/5 shrink-0 overflow-hidden relative`}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent" />
                  <BookOpen className="w-16 h-16 text-white/30 relative z-10 group-hover:scale-110 group-hover:text-white/50 transition-all duration-500" />
                </div>
                
                <div className="p-6 md:p-8 flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider bg-purple-400/10 px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {post.date}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-purple-300 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-slate-400 leading-relaxed mb-6 text-lg">
                    {post.desc}
                  </p>
                  <div className="flex items-center gap-2 text-white font-medium group-hover:text-purple-400 transition-colors">
                    Czytaj cały artykuł <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/5 bg-[#0a0a0e]/80 py-8 text-center mt-20">
        <div className="flex flex-col items-center justify-center gap-2 opacity-50">
          <span className="text-lg font-serif font-black tracking-tighter text-white">na.dobranoc</span>
        </div>
      </footer>
    </div>
  );
}
