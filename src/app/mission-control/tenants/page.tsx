'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ExternalLink, AlertCircle } from 'lucide-react';

interface Tenant {
  id: string;
  ownerEmail: string;
  packageId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  store: { id: string; name: string; status: string } | null;
  lastEvent: { eventType: string; timestamp: string; actor: string } | null;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mission-control/tenants')
      .then((r) => r.json())
      .then((d) => setTenants(d.tenants ?? []))
      .catch(() => setTenants([]))
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
        <Users className="w-5 h-5 text-violet-400" />
        <h1 className="text-2xl font-bold text-white">Tenanci ({tenants.length})</h1>
      </div>

      {tenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm">Brak zarejestrowanych tenantów</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Właściciel</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Sklep</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Pakiet</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Ostatnie zdarzenie</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Utworzono</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-slate-300">{t.ownerEmail}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      t.status === 'ACTIVE'
                        ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
                        : t.status === 'PROVISIONING'
                        ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                        : 'text-slate-500 border-slate-500/30 bg-slate-500/10'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        t.status === 'ACTIVE' ? 'bg-emerald-500' : t.status === 'PROVISIONING' ? 'bg-amber-500' : 'bg-slate-500'
                      }`} />
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.store ? (
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-300">{t.store.name || '—'}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                          t.store.status === 'READY'
                            ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
                            : 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                        }`}>{t.store.status}</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-slate-400">{t.packageId || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {t.lastEvent ? (
                      <span className="text-xs text-slate-400">
                        <span className="font-mono text-violet-300">{t.lastEvent.eventType}</span>
                        <br />
                        <span className="text-[10px] text-slate-600">{new Date(t.lastEvent.timestamp).toLocaleString('pl-PL')}</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(t.createdAt).toLocaleString('pl-PL')}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/mission-control/tenant/${t.id}/timeline`}
                      className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Oś czasu <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
