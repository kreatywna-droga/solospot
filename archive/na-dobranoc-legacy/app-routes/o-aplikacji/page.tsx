'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Brain, Heart, Smartphone, Moon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AboutAppPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white selection:bg-purple-500/30 overflow-hidden font-sans">
      
      {/* Tła i Blury */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[800px] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[800px] bg-pink-900/10 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Nawigacja */}
      <nav className="border-b border-white/5 bg-[#0a0a0e]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Wróć do strony głównej
          </button>
          <div className="text-2xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold hidden sm:block">
            Na Dobranoc
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        
        {/* Nagłówek */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            O <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">aplikacji</span>
          </h1>
          <p className="text-xl text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
            Stworzona z miłością dla rodziców, którzy marzą o spokojnym wieczorze i zdrowym, nieprzerwanym śnie swojego dziecka.
          </p>
        </motion.div>

        {/* Sekcja 1: Czym jest i dla kogo */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-12 items-center mb-32"
        >
          <div>
            <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-medium rounded-full text-sm mb-6">
              Nasza Misja
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Czym jest „Na Dobranoc”?</h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              To nie jest kolejna aplikacja z agresywnymi animacjami, które przebodźcowują malucha tuż przed snem. „Na Dobranoc” to wyciszające, bezpieczne środowisko audio, które krok po kroku przygotowuje dziecko do snu.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Dedykowana dla dzieci w wieku <strong>2-8 lat</strong>, oraz ich rodziców, którzy walczą z wieczornym zasypianiem, płaczem lub lękiem przed ciemnością. Nasze narzędzie łagodnie wprowadza rutynę zasypiania.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-[3rem] bg-gradient-to-tr from-[#111118] to-[#1a1a24] border border-white/5 p-8 flex flex-col justify-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px]" />
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <Brain className="w-8 h-8 text-purple-400 shrink-0" />
                <p className="text-sm text-slate-300">Redukcja przebodźcowania układu nerwowego</p>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <Heart className="w-8 h-8 text-pink-400 shrink-0" />
                <p className="text-sm text-slate-300">Budowanie poczucia bezpieczeństwa</p>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <Moon className="w-8 h-8 text-indigo-400 shrink-0" />
                <p className="text-sm text-slate-300">Szybsze zapadanie w głęboki sen</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sekcja 2: Jak działa i dlaczego warto */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-12 items-center mb-24 md:flex-row-reverse flex-col-reverse flex"
        >
          <div className="relative w-full">
            <div className="aspect-video md:aspect-square rounded-[3rem] bg-gradient-to-bl from-[#111118] to-[#050508] border border-white/10 p-8 flex items-center justify-center relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 blur-[80px]" />
              <div className="relative z-10 w-full max-w-[280px]">
                {/* Minimalistyczna wizualizacja trybu offline */}
                <div className="w-full bg-[#0a0a0e] rounded-3xl border border-white/10 p-6 shadow-2xl relative">
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-white/5 mb-4 mx-auto" />
                  <div className="w-3/4 h-4 bg-white/10 rounded-full mx-auto mb-2" />
                  <div className="w-1/2 h-3 bg-white/5 rounded-full mx-auto mb-8" />
                  
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                    <span className="text-xs text-slate-400">Tryb Offline</span>
                    <div className="w-8 h-4 bg-emerald-500 rounded-full relative">
                      <div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="inline-block px-4 py-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 font-medium rounded-full text-sm mb-6">
              Mechanizm
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Jak to działa w praktyce?</h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              Aplikacja działa całkowicie w tle. Przed snem wybierasz z dzieckiem ulubioną historię, włączasz tryb samolotowy, odkładasz telefon na szafkę nocną i pozwalasz magii zadziałać.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-400">1</span>
                </div>
                <p className="text-slate-300">Ciemny interfejs blokuje emisję niebieskiego światła.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-400">2</span>
                </div>
                <p className="text-slate-300">Brak powiadomień i nagłych dźwięków (100% offline).</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-400">3</span>
                </div>
                <p className="text-slate-300">Wyciszający głos lektora powoli zwalnia tempo, usypiając układ nerwowy.</p>
              </li>
            </ul>
            
            <Link href="/na-dobranoc/checkout" className="inline-flex px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              Rozpocznij zmianę już dziś
            </Link>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
