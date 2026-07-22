'use client';

import { motion } from 'framer-motion';
import { BookOpen, Headphones, Moon, Heart, Download, RefreshCcw, ShieldCheck, Smartphone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function FeaturesPage() {
  const router = useRouter();
  const features = [
    {
      id: "biblioteka-bajek",
      title: "Biblioteka Bajek",
      desc: "Starannie wyselekcjonowana kolekcja historii napisanych specjalnie w celu wyciszenia dziecka przed snem. Zero agresywnej akcji, same spokojne, kojące opowieści.",
      icon: BookOpen,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      id: "odtwarzanie-audio",
      title: "Odtwarzanie Audio",
      desc: "Zaawansowany odtwarzacz stworzony do słuchania w tle. Obsługuje pauzę, powtarzanie oraz posiada specjalny algorytm stopniowego wyciszania głośności (fade-out) gdy dziecko uśnie.",
      icon: Headphones,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    },
    {
      id: "tryb-nocny",
      title: "Tryb Nocny (Dark Mode)",
      desc: "Cały interfejs aplikacji jest skąpany w głębokich, ciemnych barwach, aby całkowicie wyeliminować emisję niebieskiego światła, które zaburza wydzielanie melatoniny.",
      icon: Moon,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20"
    },
    {
      id: "ulubione",
      title: "Ulubione Bajki",
      desc: "Dzieci kochają rutynę. Zapisuj ukochane historie swojego malucha do zakładki Ulubione, aby mieć do nich dostęp jednym kliknięciem każdego wieczoru.",
      icon: Heart,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20"
    },
    {
      id: "pobieranie-offline",
      title: "Pobieranie Offline",
      desc: "Brak zasięgu na wakacjach? A może chcesz włączyć Tryb Samolotowy, aby zablokować powiadomienia? Pobierz bajki do pamięci urządzenia i słuchaj ich bez dostępu do sieci.",
      icon: Download,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    },
    {
      id: "synchronizacja",
      title: "Synchronizacja w Chmurze",
      desc: "Zacznij słuchać na telefonie Mamy, a dokończ na tablecie w pokoju dziecka. Twój postęp, ulubione bajki i ustawienia są automatycznie synchronizowane między urządzeniami.",
      icon: RefreshCcw,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20"
    },
    {
      id: "panel-rodzica",
      title: "Panel Rodzica",
      desc: "Zabezpieczona strefa, w której możesz zarządzać licencją, śledzić statystyki słuchania oraz blokować wybrane treści. Pełna kontrola w Twoich rękach.",
      icon: ShieldCheck,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20"
    },
    {
      id: "zarzadzanie-urzadzeniami",
      title: "Zarządzanie Urządzeniami",
      desc: "W zależności od wybranego planu (np. Family), możesz podłączyć od 1 do 4 urządzeń do jednego konta. Łatwo odpinaj i przypinaj nowe telefony czy tablety.",
      icon: Smartphone,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white selection:bg-purple-500/30 overflow-hidden font-sans">
      
      {/* Tła i Blury */}
      <div className="fixed top-[10%] left-[-10%] w-[50%] h-[600px] bg-indigo-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[800px] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none z-0" />

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

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        
        {/* Nagłówek */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-medium rounded-full text-sm mb-6">
            Możliwości Aplikacji
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Poznaj wszystkie <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">funkcje</span>
          </h1>
          <p className="text-xl text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
            Zaprojektowaliśmy aplikację "Na Dobranoc" tak, by posiadała wszystko czego potrzebujesz do usypiania malucha, bez zbędnych, rozpraszających dodatków.
          </p>
        </motion.div>

        {/* Siatka Funkcji */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group p-8 rounded-3xl bg-[#111118] border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${feature.bg} blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} ${feature.border} border flex items-center justify-center mb-6 relative z-10`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4 relative z-10">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Sekcja dolna CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-32 p-12 rounded-[3rem] bg-gradient-to-r from-[#150a21] to-[#0a0a0e] border border-purple-500/20 text-center relative overflow-hidden"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Wszystko to w cenie jednego zakupu</h2>
            <p className="text-lg text-slate-300 font-light max-w-2xl mx-auto mb-10">
              Brak ukrytych opłat, brak reklam, natychmiastowy dostęp do wszystkich funkcji Premium po założeniu konta.
            </p>
            <Link href="/na-dobranoc/checkout" className="inline-flex px-10 py-5 bg-white text-black font-extrabold rounded-full hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] text-lg">
              Przetestuj przez 7 dni za darmo
            </Link>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
