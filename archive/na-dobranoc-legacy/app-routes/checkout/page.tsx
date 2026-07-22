'use client';

import { Suspense, useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Checkout PoW (Sprint 6)
// - brak twardego przekierowania na sztywno
// - przekierowanie tylko jako adapter płatności (1koszyk) z linkiem zależnym od planu
// - gdy zabraknie wymaganych parametrów: zwracamy UI zamiast przekierowania
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0e] text-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {

  const searchParams = useSearchParams();
  const router = useRouter();



  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planId = searchParams.get('planId') || 'lifetime';
  const email = searchParams.get('email');
  const userId = searchParams.get('userId');

  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    // Checkout UI: zero wiedzy o 1koszyk.
    // Kontrakt: tworzymy sesję przez PaymentProvider.
    let cancelled = false;

    const run = async () => {
      try {
        const { PaymentFactory } = await import('@/lib/payments');

        const provider = PaymentFactory.getProvider({
          planId,
          email: email || undefined,
          userId: userId || undefined,
          correlationId: undefined,
        });

        const session = await provider.createCheckoutSession({
          planId,
          tenantId: undefined,
          userId: userId || undefined,
          email: email || undefined,
          correlationId: undefined,
        });

        if (!cancelled) setCheckoutUrl(session.redirectUrl);
      } catch {
        if (!cancelled) {
          setError('Nie udało się przygotować sesji checkout.');
          setIsRedirecting(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [planId, email, userId]);


  useEffect(() => {
    // fail-safe: brak planId → nie redirectujemy
    if (!planId) {
      // unikamy setState wewnątrz efektu
      return;
    }

    setIsRedirecting(true);

    if (!checkoutUrl) {
      setIsRedirecting(false);
      return;
    }

    const t = setTimeout(() => {
      try {
        window.location.href = checkoutUrl;
      } catch {
        setIsRedirecting(false);
        setError('Nie udało się przekierować do bramki płatności.');
      }
    }, 150);


    return () => clearTimeout(t);
  }, [checkoutUrl, planId]);


  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white flex flex-col items-center justify-center p-4">
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[800px] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[800px] bg-pink-900/10 blur-[150px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col items-center max-w-[560px] text-center">
        <Loader2 className={`w-12 h-12 text-purple-500 mb-6 ${isRedirecting ? 'animate-spin' : 'opacity-60'}`} />
        <h1 className="text-2xl font-bold">Przekierowuję do płatności...</h1>
        <p className="text-slate-400 mt-2">
          Bramkę płatności uruchamiamy jako adapter. Po potwierdzeniu webhook zaktualizuje status w systemie.
        </p>

        {error && (
          <div className="mt-6 w-full rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {!isRedirecting && (
          <div className="mt-6">
            <Link href="/" className="inline-block px-6 py-3 rounded-full bg-white/10 border border-white/15 hover:bg-white/15">
              Wróć na stronę główną
            </Link>
          </div>
        )}

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 text-xs text-slate-500">
            planId: <span className="text-slate-300">{planId}</span>
          </div>
        )}

        {/* fallback na cancel */}
        <button
          type="button"
          onClick={() => router.push('/na-dobranoc/checkout?canceled=true')}
          className="mt-6 px-4 py-2 text-slate-400 font-medium hover:text-white transition-colors"
        >
          Anuluj
        </button>
      </div>
    </div>
  );
}

