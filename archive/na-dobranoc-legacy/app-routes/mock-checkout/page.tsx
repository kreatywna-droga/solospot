'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useState, Suspense } from 'react';

export default function MockCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0e] text-white flex items-center justify-center">Ładowanie...</div>}>
      <MockCheckout />
    </Suspense>
  );
}

function MockCheckout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');
  const planId = searchParams.get('planId');
  const email = searchParams.get('email');
  
  const [isProcessing, setIsProcessing] = useState(false);

  const simulatePayment = () => {
    setIsProcessing(true);
    // Symulacja 2-sekundowego przetwarzania
    setTimeout(() => {
      // Skoro to mock, nie wysyłamy webhooka (to robi Stripe server-to-server).
      // W wersji bezkluczowej możemy po prostu wrócić z success=true
      router.push(`/na-dobranoc/checkout/sukces?session_id=mock_session_123&planId=${planId}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0e] flex items-center justify-center p-6 selection:bg-purple-500/30">
      <div className="w-full max-w-md bg-[#111118]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 text-center shadow-[0_0_100px_rgba(168,85,247,0.1)]">
        <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Środowisko Testowe</h1>
        <p className="text-slate-400 text-sm mb-8">
          Jesteś w trybie deweloperskim (brak klucza Stripe). Ta strona symuluje bramkę płatności Stripe Checkout dla planu <b>{planId}</b>.
        </p>
        
        <button 
          onClick={simulatePayment}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-70"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          {isProcessing ? 'Przetwarzanie płatności...' : 'Zasymuluj udaną płatność'}
        </button>

        <button 
          onClick={() => router.push('/na-dobranoc/checkout?canceled=true')}
          disabled={isProcessing}
          className="w-full mt-4 py-4 text-slate-400 font-medium hover:text-white transition-colors"
        >
          Anuluj
        </button>
      </div>
    </div>
  );
}
