'use client';

import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, ArrowRight, Smartphone, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0e]" />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Ustawiamy flagę premium w localStorage po udanym zakupie
    // W środowisku produkcyjnym powinniśmy zwalidować session_id ze Stripe
    localStorage.setItem('naDobranoc_isPremium', 'true');
    localStorage.removeItem('naDobranoc_trialStart');
    
  }, [searchParams]);

  if (!isClient) return <div className="min-h-screen bg-[#0a0a0e]" />;

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white flex flex-col relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
      
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-2xl w-full">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[#111118] border border-emerald-500/20 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(16,185,129,0.1)] text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
            
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 relative"
            >
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
              <CheckCircle2 className="w-12 h-12 text-emerald-400 relative z-10" />
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">Płatność Zakończona Pomyślnie!</h1>
            <p className="text-lg text-slate-400 mb-8 max-w-lg mx-auto">
              Dziękujemy za zaufanie! Twój dostęp Premium został pomyślnie aktywowany. Paragon został wysłany na Twój adres e-mail.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-10 text-left">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex gap-4">
                <Smartphone className="w-8 h-8 text-purple-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-white mb-1">Krok 1: Pobierz APK</h3>
                  <p className="text-sm text-slate-400">Pobierz i zainstaluj aplikację "Na Dobranoc" na swoim urządzeniu z Androidem.</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex gap-4">
                <Mail className="w-8 h-8 text-pink-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-white mb-1">Krok 2: Zaloguj się</h3>
                  <p className="text-sm text-slate-400">Użyj danych swojego konta podczas pierwszego uruchomienia aplikacji.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => {
                  // W przyszłości pobieranie rzeczywistego piku .apk z serwera
                  alert('Rozpoczęto pobieranie pliku na-dobranoc.apk!');
                }}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full transition-colors flex items-center justify-center gap-2 text-lg shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                <Download className="w-6 h-6" />
                Pobierz Aplikację (.APK)
              </button>
              
              <Link 
                href="/dashboard"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition-colors flex items-center justify-center gap-2 text-lg border border-white/10"
              >
                Przejdź do Panelu
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
