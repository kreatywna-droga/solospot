'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertCircle } from 'lucide-react';

interface TimelineEvent {
  eventId: string;
  eventType: string;
  tenantId: string;
  timestamp: string;
  correlationId: string;
  payload: Record<string, unknown>;
}

export default function EventsPage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mission-control/events')
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => setEvents([]))
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
        <Activity className="w-5 h-5 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">Zdarzenia ({events.length})</h1>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm">Brak zarejestrowanych zdarzeń</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Znacznik czasu</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Typ zdarzenia</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">Tenant</th>
                <th className="text-left px-4 py-3 font-bold text-xs text-slate-400 uppercase tracking-wider">ID korelacji</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.map((evt) => {
                const typeLower = evt.eventType.toLowerCase();
                let dotColor = 'bg-violet-500';
                if (typeLower.includes('payment') || typeLower.includes('order')) dotColor = 'bg-amber-500';
                else if (typeLower.includes('tenant')) dotColor = 'bg-emerald-500';
                else if (typeLower.includes('error') || typeLower.includes('fail')) dotColor = 'bg-red-500';

                return (
                  <tr key={evt.eventId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString('pl-PL')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />
                        <span className="font-mono text-xs text-violet-300">{evt.eventType}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-400">{evt.tenantId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-slate-600">{evt.correlationId}</span>
                    </td>
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
