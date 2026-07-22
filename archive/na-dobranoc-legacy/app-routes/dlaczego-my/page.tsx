'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, Ban, Plane, Mic, BookOpen, Users, RefreshCw, Lock, Moon, Heart, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    title: 'Bezpieczna dla dzieci',
    desc: 'Każdy element aplikacji został zaprojektowany z myślą o najmłodszych. Skupiamy się na spokojnym doświadczeniu, eliminując zbędne bodźce, agresywne animacje i treści, które mogłyby zakłócać wieczorny rytuał zasypiania.'
  },
  {
    icon: Ban,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    title: 'Bez reklam',
    desc: 'Wieczorny spokój nie powinien być przerywany reklamami. W aplikacji nie znajdziesz wyskakujących okien, banerów ani materiałów promocyjnych, dzięki czemu nic nie odwraca uwagi dziecka od spokojnego wyciszenia.'
  },
  {
    icon: Plane,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    title: 'Działa offline',
    desc: 'Pobierz ulubione bajki na urządzenie i korzystaj z aplikacji bez dostępu do Internetu. To wygodne rozwiązanie podczas podróży, w miejscach bez zasięgu oraz wszędzie tam, gdzie liczy się cisza i brak rozpraszających powiadomień.'
  },
  {
    icon: Mic,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    title: 'Profesjonalni lektorzy',
    desc: 'Nasze bajki czytane są spokojnym, naturalnym głosem, który sprzyja wyciszeniu i buduje przyjemną atmosferę przed snem. Stawiamy na jakość narracji, dzięki której słuchanie staje się prawdziwym wieczornym rytuałem.'
  },
  {
    icon: BookOpen,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    title: 'Starannie dobrane historie',
    desc: 'Każda bajka została wybrana z myślą o spokojnym zakończeniu dnia. Historie rozwijają wyobraźnię, uczą pozytywnych wartości i pomagają dziecku łagodnie przejść od codziennych emocji do spokojnego snu.'
  },
  {
    icon: Users,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    title: 'Panel rodzica',
    desc: 'Pełna kontrola nad kontem w jednym miejscu. Zarządzaj licencją, urządzeniami oraz ustawieniami aplikacji szybko i wygodnie z poziomu bezpiecznego panelu użytkownika.'
  },
  {
    icon: RefreshCw,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    title: 'Regularne aktualizacje',
    desc: 'Nieustannie rozwijamy aplikację, dodając nowe bajki, funkcje oraz usprawnienia. Dzięki regularnym aktualizacjom aplikacja pozostaje nowoczesna, bezpieczna i stale wzbogacana o nową zawartość.'
  },
  {
    icon: Lock,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    title: 'Prywatność i bezpieczeństwo danych',
    desc: 'Prywatność Twojej rodziny jest dla nas priorytetem. Zbieramy wyłącznie dane niezbędne do działania usługi, stosujemy szyfrowane połączenia oraz nowoczesne mechanizmy ochrony, aby zapewnić bezpieczeństwo Twojego konta i danych.'
  },
  {
    icon: Moon,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    title: 'Zaprojektowana z myślą o spokojnym wieczorze',
    desc: 'Każdy element aplikacji – od kolorystyki i typografii po sposób odtwarzania bajek – został zaprojektowany tak, aby wspierać wyciszenie i stworzyć przyjemną atmosferę przed snem.'
  },
  {
    icon: Heart,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    title: 'Tworzona z pasją i odpowiedzialnością',
    desc: '„Na Dobranoc” powstaje z myślą o rodzinach, które chcą świadomie budować spokojne wieczorne rytuały. Łączymy nowoczesną technologię z prostotą, bezpieczeństwem i wysoką jakością treści.'
  }
];

export default function AboutPage() {
  const { scrollYProgress } = useScroll();
  const yBackground = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  return (
    <div className="min-h-screen bg-[#0a0a0e] selection:bg-purple-500/30 overflow-hidden relative">
      
      {/* Background Blurs */}
      <motion.div style={{ y: yBackground }} className="absolute top-[-10%] left-[-10%] w-[50%] h-[600px] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <motion.div style={{ y: yBackground }} className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[600px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
      
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-12 md:py-24">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Powrót do strony głównej
          </Link>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6">
            Dlaczego <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Na Dobranoc?</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
            Poznaj wartości, które stoją za najbardziej zaawansowaną aplikacją do usypiania na rynku. Spokój Twojego dziecka to nasz priorytet.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (idx % 2) * 0.1 }}
              className="group relative p-8 lg:p-10 rounded-[2rem] bg-[#111118] border border-white/5 hover:border-purple-500/30 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-6 mb-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${feature.bgColor} border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{feature.title}</h3>
                </div>
                <p className="text-slate-400 leading-relaxed font-light text-lg">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call To Action */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-24 text-center p-12 lg:p-20 rounded-[3rem] bg-gradient-to-b from-[#1a1a24] to-[#0a0a0e] border border-white/10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 relative z-10 tracking-tight">Gotowy na spokojne wieczory?</h2>
          <p className="text-xl text-slate-400 font-light mb-10 max-w-2xl mx-auto relative z-10">
            Dołącz do rodzin, które już odkryły nowy wymiar wieczornego rytuału.
          </p>
          <Link href="/na-dobranoc/checkout" className="relative z-10 inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-full shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:scale-105 transition-all">
            Kup Dostęp
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
