'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, AlertCircle, Package } from 'lucide-react';

interface OrderSummary {
  id: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  itemCount: number;
  customerName?: string;
}

const statusColors: Record<string, { dot: string; bg: string; border: string; text: string }> = {
  PAID: { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300' },
  PENDING: { dot: 'bg-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300' },
  PAYMENT_PENDING: { dot: 'bg-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300' },
  FAILED: { dot: 'bg-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300' },
  CANCELLED: { dot: 'bg-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-300' },
  REFUNDED: { dot: 'bg-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-300' },
  FULFILLED: { dot: 'bg-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300' },
};

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/store/orders')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrders(d.orders ?? []);
        else setError(d.error || 'Błąd ładowania zamówień');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingBag className="w-5 h-5 text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">Zamówienia ({orders.length})</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!error && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
          <Package className="w-8 h-8" />
          <p className="text-sm">Brak zamówień. Wkrótce się tu pojawią po pierwszych zakupach.</p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Pozycje</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Kwota</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((o) => {
                const sc = statusColors[o.status] ?? { dot: 'bg-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-300' };
                return (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-300">{o.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sc.bg} ${sc.border} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{o.itemCount}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                      {(o.total / 100).toFixed(2)} {o.currency}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(o.createdAt).toLocaleString('pl-PL')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
