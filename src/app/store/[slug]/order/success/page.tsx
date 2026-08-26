'use client';

/**
 * /store/[slug]/order/success — Sprint 6 Step 6
 *
 * Potwierdzenie zamówienia. Status pochodzi z OrderProcessingEngine.
 */

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function OrderSuccessPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Zamówienie złożone!</h1>
        <p className="text-slate-500 mb-2">
          Dziękujemy za zakupy. Twoje zamówienie zostało przyjęte.
        </p>
        {orderId && (
          <p className="text-sm text-slate-400 mb-6">
            Numer zamówienia: <span className="font-mono font-medium">{orderId}</span>
          </p>
        )}
        <div className="space-y-3">
          <button
            onClick={() => router.push(`/store/${slug}/order/${orderId || ''}`)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Sprawdź status zamówienia
          </button>
          <button
            onClick={() => router.push(`/store/${slug}`)}
            className="w-full px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Wróć do sklepu
          </button>
        </div>
      </div>
    </div>
  );
}
