'use client';

/**
 * /store/[slug]/checkout — Sprint 6 Step 6
 *
 * CIENKA WARSTWA UI (ZERO logiki biznesowej).
 * Wykorzystuje POST /api/store/checkout do orkiestracji.
 */

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart, CartProvider } from '@/lib/cart/CartStore';

function CheckoutForm(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { state, dispatch } = useCart();

  const [fullName, setFullName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Koszyk jest pusty</h1>
          <button
            onClick={() => router.push(`/store/${slug}`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Wróć do sklepu
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          items: state.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceGross: item.price,
          })),
          shippingAddress: { fullName, street, city, zipCode, country: 'PL' },
          currency: 'PLN',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Wyczyść koszyk po udanym checkout
      dispatch({ type: 'CLEAR' });

      // Przekieruj do paywall lub success
      if (data.redirectUrl && data.redirectUrl.startsWith('http')) {
        window.location.href = data.redirectUrl;
      } else {
        router.push(`/store/${slug}/order/success?orderId=${data.orderId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas składania zamówienia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Kasa</h1>

        {/* Podsumowanie koszyka */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <h2 className="font-semibold text-slate-800 mb-3">Podsumowanie koszyka</h2>
          {state.items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm py-1">
              <span className="text-slate-600">{item.productId} × {item.quantity}</span>
            </div>
          ))}
          <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between font-semibold">
            <span>Liczba produktów:</span>
            <span>{state.itemCount}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 mb-2">Adres dostawy</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Imię i nazwisko</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jan Kowalski"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ulica i numer</label>
            <input
              type="text"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ul. Główna 123"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Miasto</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Warszawa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kod pocztowy</label>
              <input
                type="text"
                required
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="00-001"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {loading ? 'Przetwarzanie...' : 'Złóż zamówienie'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage(): React.JSX.Element {
  return (
    <CartProvider>
      <CheckoutForm />
    </CartProvider>
  );
}
