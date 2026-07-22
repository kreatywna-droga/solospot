'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Check, Minus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ComparePlansPage() {
  const router = useRouter();
  const plans = [
    {
      name: 'Wersja Próbna (7 Dni)',
      price: '0 zł',
      color: 'border-white/10 text-slate-400',
      bg: 'bg-white/5',
      features: [
        { name: 'Odtwarzanie w tle (przy zablokowanym ekranie)', included: true },
        { name: 'Odtwarzanie z ekranem', included: true },
        { name: 'Tryb Nocny (Dark Mode)', included: true },
        { name: 'Zarządzanie urządzeniami', included: true },
        { name: 'Pełna biblioteka bajek', included: true },
        { name: 'Tryb Offline', included: true },
        { name: 'Brak mikropłatności i reklam', included: true },
        { name: 'Odpinanie urządzeń (Panel)', included: true },
      ]
    },
    {
      name: 'Dostęp Dożywotni',
      price: '70 zł',
      color: 'border-pink-500/30 text-pink-400',
      bg: 'bg-pink-500/10',
      badge: 'Jednorazowo',
      features: [
        { name: 'Odtwarzanie w tle (przy zablokowanym ekranie)', included: true },
        { name: 'Odtwarzanie z ekranem', included: true },
        { name: 'Tryb Nocny (Dark Mode)', included: true },
        { name: 'Zarządzanie urządzeniami', included: true },
        { name: 'Pełna biblioteka bajek', included: true },
        { name: 'Tryb Offline', included: true },
        { name: 'Brak mikropłatności i reklam', included: true },
        { name: 'Odpinanie urządzeń (Panel)', included: true },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white selection:bg-purple-500/30 font-sans">
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

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Porównanie Planów</h1>
          <p className="text-lg text-slate-400">Znajdź idealny plan dla Ciebie i Twojej rodziny.</p>
        </div>

        <div className="hidden md:block overflow-hidden rounded-3xl border border-white/10 bg-[#111118]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-8 border-b border-white/10 w-1/3"></th>
                {plans.map(plan => (
                  <th key={plan.name} className="p-8 border-b border-white/10 border-l w-1/3 text-center">
                    {plan.badge && (
                      <div className="text-xs font-bold uppercase tracking-wider mb-2 text-white bg-white/10 inline-block px-3 py-1 rounded-full">
                        {plan.badge}
                      </div>
                    )}
                    <h3 className={`text-xl font-bold mb-2 ${plan.color.split(' ')[1]}`}>{plan.name}</h3>
                    <div className="text-2xl font-black">{plan.price}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans[0].features.map((feature, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="p-6 border-b border-white/10 text-slate-300 font-medium">
                    {feature.name}
                  </td>
                  {plans.map(plan => (
                    <td key={plan.name + i} className="p-6 border-b border-white/10 border-l text-center">
                      {plan.features[i].included ? (
                        <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                      ) : (
                        <Minus className="w-5 h-5 text-slate-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-8"></td>
                {plans.map(plan => (
                  <td key={plan.name + 'cta'} className="p-8 border-l border-white/10 text-center">
                    <Link href={plan.name.includes('Próbna') ? '/na-dobranoc/logowanie' : '/na-dobranoc/checkout'} className={`inline-block w-full py-3 rounded-full font-bold transition-all ${!plan.name.includes('Próbna') ? 'bg-white text-black hover:bg-slate-200' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                      Wybierz
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Widok mobilny */}
        <div className="md:hidden space-y-8">
          {plans.map(plan => (
            <div key={plan.name} className={`rounded-3xl border ${plan.color.split(' ')[0]} bg-[#111118] p-6 relative overflow-hidden`}>
              <div className={`absolute top-0 right-0 w-32 h-32 ${plan.bg} blur-[50px] pointer-events-none`} />
              {plan.badge && (
                <div className="text-xs font-bold uppercase tracking-wider mb-4 text-white bg-white/10 inline-block px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}
              <h3 className={`text-2xl font-bold mb-2 ${plan.color.split(' ')[1]}`}>{plan.name}</h3>
              <div className="text-3xl font-black mb-6">{plan.price}</div>
              
              <ul className="space-y-4 mb-8 relative z-10">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Minus className="w-5 h-5 text-slate-600 shrink-0" />
                    )}
                    <span className={feature.included ? 'text-slate-200' : 'text-slate-500 line-through'}>{feature.name}</span>
                  </li>
                ))}
              </ul>
              
              <Link href={plan.name.includes('Próbna') ? '/na-dobranoc/logowanie' : '/na-dobranoc/checkout'} className={`block w-full py-4 text-center rounded-xl font-bold transition-all ${!plan.name.includes('Próbna') ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
                Wybierz {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
