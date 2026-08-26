'use client';

/**
 * /store/[slug]/order/[id] — Sprint 7 Recovery (P4)
 *
 * Status zamówienia — pobierany serwerowo przez
 *   GET /api/store/order/[id]?slug=<slug>
 *
 * ZERO logiki biznesowej na kliencie. Brak importu `OrderRuntime` w pliku
 * 'use client' (dług architektoniczny z Sprintu 6 Step 6 usunięty).
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ProcessedOrder } from '../../../../../../packages/commerce-engine/src';

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Utworzone',
  PAYMENT_PENDING: 'Oczekuje na płatność',
  PAID: 'Opłacone',
  PROCESSING: 'W realizacji',
  READY_FOR_FULFILLMENT: 'Gotowe do wysyłki',
  FULFILLED: 'Zrealizowane',
  CANCELLED: 'Anulowane',
  REFUNDED: 'Zwrócone',
};

const STATUS_COLORS: Record<string, string> = {
  CREATED: 'bg-blue-100 text-blue-800',
  PAYMENT_PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  READY_FOR_FULFILLMENT: 'bg-purple-100 text-purple-800',
  FULFILLED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

export default function OrderStatusPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const orderId = params.id as string;

  const [order, setOrder] = useState<ProcessedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

useEffect(() => {
    if (!orderId || !slug) return;

    let active = true;

    // Pobierz zamówienie serwerowo przez API (izolacja tenantów, brak logiki klienta)
    fetch(`/api/store/order/${encodeURIComponent(orderId)}?slug=${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Nie znaleziono zamówienia' : 'Błąd serwera');
        }
        return res.json() as Promise<ProcessedOrder>;
      })
      .then((result) => {
        if (!active) return;
        setOrder(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Nie znaleziono zamówienia');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId, slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-slate-400">Ładowanie...</div></div>;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Zamówienie nie znalezione</h1>
          <p className="text-slate-500 mb-6">{error || 'Nie ma takiego zamówienia'}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Status zamówienia</h1>
        <p className="text-slate-500 mb-6">
          Numer: <span className="font-mono font-medium">{order.id}</span>
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>

          <div className="border-t border-slate-200 pt-4 mt-4">
            <h3 className="font-semibold text-slate-800 mb-2">Adres dostawy</h3>
            <p className="text-sm text-slate-600">
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.street}<br />
              {order.shippingAddress.city}, {order.shippingAddress.zipCode}<br />
              {order.shippingAddress.country}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Produkty</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-slate-600">{item.productId} × {item.quantity}</span>
                <span className="font-medium">{(item.totalGross / 100).toFixed(2)} PLN</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between font-semibold">
            <span>Razem</span>
            <span>{(order.grandTotalGross / 100).toFixed(2)} {order.currency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
