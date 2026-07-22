import Link from 'next/link';
import { Moon, ChevronLeft } from 'lucide-react';

export default function CookiesPolicy() {
  return (
    <div className="min-h-screen bg-[#0a0a0e] text-slate-200 selection:bg-purple-500/30 font-light">
      <nav className="relative z-50 px-6 lg:px-12 py-8 max-w-[1200px] mx-auto border-b border-white/5">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" /> Wróć na stronę główną
        </Link>
      </nav>

      <main className="max-w-[800px] mx-auto py-16 px-6 lg:px-12 relative z-10">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Polityka Cookies</h1>
        <p className="text-slate-400 mb-12">Ostatnia aktualizacja: Czerwiec 2026</p>

        <div className="space-y-8 text-lg leading-relaxed text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Czym są pliki Cookies?</h2>
            <p>
              Pliki cookies (tzw. „ciasteczka”) to niewielkie dane informatyczne, najczęściej pliki tekstowe, które przechowywane są na Twoim urządzeniu końcowym (telefonie, tablecie, komputerze) podczas korzystania ze strony internetowej "Na Dobranoc".
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Do czego używamy Cookies?</h2>
            <p>
              Stosujemy pliki cookies wyłącznie w celu świadczenia usługi na najwyższym poziomie (cookies niezbędne). Nie używamy ciasteczek do śledzenia Cię w celach reklamowych. Nasze cookies odpowiadają za:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Utrzymanie sesji Użytkownika (abyś nie musiał logować się na każdej podstronie).</li>
              <li>Bezpieczeństwo formularzy i płatności (integracja ze 1koszyk).</li>
              <li>Zapisywanie Twoich preferencji, takich jak ustawienia odtwarzacza na stronie internetowej (jeśli używasz webowej wersji).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Zarządzanie plikami Cookies</h2>
            <p>
              W większości przeglądarek internetowych możesz samodzielnie zarządzać plikami cookies, a nawet całkowicie je zablokować. Pamiętaj jednak, że zablokowanie tzw. "ciasteczek niezbędnych" uniemożliwi Ci zalogowanie się do Strefy Klienta i zarządzanie swoją licencją.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 bg-[#0a0a0e]/80 backdrop-blur-lg py-8 text-center mt-20">
        <div className="flex items-center justify-center gap-2 opacity-50">
          <Moon className="w-5 h-5 text-purple-500" />
          <span className="text-lg font-serif font-black tracking-tighter text-white">na.dobranoc</span>
        </div>
      </footer>
    </div>
  );
}
