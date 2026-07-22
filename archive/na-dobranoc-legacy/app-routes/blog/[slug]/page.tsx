import { getBlogPosts, getBlogPostBySlug } from '@/lib/blogData';
import { ChevronLeft, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export async function generateStaticParams() {
  const blogPosts = getBlogPosts();
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white selection:bg-purple-500/30 pb-20">
      <nav className="relative z-50 px-6 lg:px-12 py-8 max-w-[1200px] mx-auto border-b border-white/5 flex items-center justify-between">
        <Link href="/na-dobranoc/blog" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Wróć do artykułów
        </Link>
        <Link href="/" className="text-xl font-serif font-black tracking-tighter text-white opacity-80 hover:opacity-100 transition-opacity">
          na.dobranoc
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-16 relative z-10">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider bg-purple-400/10 px-3 py-1 rounded-full">
              {post.category}
            </span>
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> {post.date}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 font-serif leading-tight">
            {post.title}
          </h1>
          <p className="text-xl text-slate-400 font-light leading-relaxed">
            {post.desc}
          </p>
        </div>

        <div className={`w-full h-24 md:h-32 rounded-3xl ${post.image} mb-12 border border-white/10`} />

        <article className="max-w-none text-lg text-slate-300 leading-relaxed font-light
          [&>p]:mb-6 [&>h2]:mt-12 [&>h2]:mb-6 [&>h2]:text-2xl [&>h2]:font-serif [&>h2]:font-bold [&>h2]:text-white
          [&>strong]:text-purple-300 [&>strong]:font-bold"
        >
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>

        <div className="mt-20 pt-10 border-t border-white/5 text-center">
          <h3 className="text-2xl font-bold mb-6">Spokojny sen zaczyna się tutaj</h3>
          <Link href="/na-dobranoc/logowanie" className="inline-block px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full transition-colors shadow-[0_0_20px_rgba(147,51,234,0.3)]">
            Wypróbuj aplikację przez 7 dni za darmo
          </Link>
        </div>
      </main>
    </div>
  );
}
