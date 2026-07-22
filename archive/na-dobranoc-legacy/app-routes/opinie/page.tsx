'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

import { supabase } from '@/lib/supabase';

const defaultTestimonials = [
  {
    id: 1,
    name: "Anna Kowalska",
    role: "Mama 3-letniego Jasia",
    text: "Próbowaliśmy wszystkiego. Suszarki, projektorów, śpiewania... Odkąd używamy tej aplikacji, Jaś zasypia w 10 minut. Aplikacja w trybie samolotowym to dla mnie absolutny game-changer.",
    rating: 5,
    initials: "AK",
    color: "from-purple-400 to-pink-500"
  },
  {
    id: 2,
    name: "Michał Zawadzki",
    role: "Tata bliźniaków",
    text: "Bałem się, że telefon przed snem będzie tylko rozbudzał dzieci. Ale interfejs jest tak ciemny i pozbawiony bodźców, że działa wyciszająco. Lektor ma niezwykle kojący głos.",
    rating: 5,
    initials: "MZ",
    color: "from-blue-400 to-indigo-500"
  },
  {
    id: 3,
    name: "Katarzyna L.",
    role: "Mama 5-letniej Zosi",
    text: "Najlepiej wydane pieniądze. Kupiłam dostęp dożywotni i wreszcie mamy z mężem wieczory dla siebie. Dźwięki tła (szum morza) grają całą noc, przez co Zosia nie budzi się przy byle hałasie.",
    rating: 5,
    initials: "KL",
    color: "from-fuchsia-400 to-purple-600"
  }
];

export default function OpinionsPage() {
  const [testimonials, setTestimonials] = useState<any[]>(defaultTestimonials);

  useEffect(() => {
    const fetchOpinions = async () => {
      try {
        const { data } = await supabase
          .from('opinie')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (data && data.length > 0) {
          // Format the DB records to match our UI object structure
          const formattedData = data.map(dbItem => ({
            id: dbItem.id,
            name: dbItem.author_name,
            role: dbItem.author_role,
            text: dbItem.content,
            rating: dbItem.rating,
            initials: dbItem.author_name.substring(0, 2).toUpperCase(),
            color: 'from-amber-400 to-orange-500',
            created_at: dbItem.created_at
          }));
          
          setTestimonials([...formattedData, ...defaultTestimonials]);
        } else {
          setTestimonials(defaultTestimonials);
        }
      } catch (e) {
        console.error("Failed to load opinions", e);
      }
    };
    fetchOpinions();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white relative">
      {/* Background FX */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-pink-900/10 to-transparent pointer-events-none" />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0e]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-20 flex items-center gap-4">
          <Link href="/#opinie" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </Link>
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-pink-400" />
            <h1 className="text-xl font-bold tracking-wide">Wszystkie opinie rodziców</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-32 pb-24 max-w-6xl mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Zaufali nam <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">rodzice</span>
          </h2>
          <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">
            Przejrzyj historie osób, które dzięki nam odzyskały spokojne wieczory. Każda opinia ma dla nas ogromne znaczenie!
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div 
              key={t.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="p-8 lg:p-10 rounded-[2.5rem] bg-[#111118]/80 border border-white/5 backdrop-blur-sm hover:border-purple-500/30 transition-colors flex flex-col h-full shadow-xl"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(t.rating)].map((_, starIndex) => (
                  <svg key={starIndex} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              
              <p className="text-lg text-slate-300 font-light leading-relaxed mb-10 flex-grow italic">
                &quot;{t.text}&quot;
              </p>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${t.color} text-white font-bold text-lg shadow-lg flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{t.name}</h4>
                    <p className="text-sm text-slate-500 font-medium">{t.role}</p>
                  </div>
                </div>
                {t.created_at && (
                  <span className="text-xs text-slate-600">{new Date(t.created_at).toLocaleDateString('pl-PL')}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Formularz dodawania opinii */}
        <div className="mt-20 max-w-2xl mx-auto bg-[#111118]/80 border border-white/5 rounded-3xl p-8 lg:p-12 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/10 blur-[50px] pointer-events-none rounded-full" />
          
          <div className="text-center mb-8 relative z-10">
            <h3 className="text-2xl font-bold text-white mb-2">Podziel się swoją historią</h3>
            <p className="text-sm text-slate-400">Twoja opinia może pomóc innym rodzicom podjąć decyzję.</p>
          </div>
          
          <form 
            className="space-y-6 relative z-10"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value;
              const role = (form.elements.namedItem('role') as HTMLInputElement).value;
              const text = (form.elements.namedItem('text') as HTMLTextAreaElement).value;
              
              if (!name || !text) return;
              
              // Zapisz do bazy danych
              await supabase.from('opinie').insert([{
                author_name: name,
                author_role: role || 'Rodzic',
                content: text,
                rating: 5
              }]);
              
              // Optymistycznie zaktualizuj UI
              const newOpinion = {
                id: Date.now(),
                name,
                role: role || 'Rodzic',
                text,
                rating: 5,
                initials: name.substring(0, 2).toUpperCase(),
                color: 'from-amber-400 to-orange-500', // nowy kolor dla wyróżnienia własnych opinii
                created_at: new Date().toISOString()
              };
              
              const updated = [newOpinion, ...testimonials];
              setTestimonials(updated);
              
              form.reset();
              alert('Dziękujemy! Twoja opinia została pomyślnie opublikowana i jest widoczna dla innych.');
            }}
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Twoje imię</label>
                <input 
                  name="name"
                  type="text" 
                  required
                  placeholder="np. Anna K."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Rola (opcjonalnie)</label>
                <input 
                  name="role"
                  type="text" 
                  placeholder="np. Mama 4-letniej Zosi"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Twoja opinia</label>
              <textarea 
                name="text"
                required
                placeholder="Napisz, jak aplikacja sprawdziła się u Was..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors min-h-[120px] resize-y" 
              />
            </div>
            
            <button 
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transform hover:scale-[1.01]"
            >
              Wyślij Opinię
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
