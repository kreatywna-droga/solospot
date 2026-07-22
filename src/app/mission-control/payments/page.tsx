'use client';

import { useEffect, useState } from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';

interface Order {
  orderId: string;
  paymentIntentId: string;
  tenantId: string;
  provider: string;
  providerTransactionId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mission-control/orders')
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const statusColors: Record<string, { dot: string; bg: string; border: string; text: string }> = {
    PAID: { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300' },
    PENDING: { dot: 'bg-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300' },
    FAILED: { dot: 'bg-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300' },
    CAPTURED: { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-5 h-5 text-amber-400" />
        <h1 className="text-2xl font-bold text-white">Płatności ({orders.length})</h1>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm">Brak zarejestrowanych płatności</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">ID zamówienia</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Tenant</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Dostawca</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Utworzono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((o) => {
                const sc = statusColors[o.status] ?? { dot: 'bg-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-300' };
                return (
                  <tr key={o.paymentIntentId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-300">{o.orderId || o.paymentIntentId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-400">{o.tenantId}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{o.provider}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sc.bg} ${sc.border} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {o.status}
                      </span>
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
