'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface TimelineEntry {
  eventId: string;
  eventType: string;
  tenantId: string;
  timestamp: string;
  correlationId: string;
  actor: string;
  payload: Record<string, unknown>;
}

export default function TenantTimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [events, setEvents] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/mission-control/tenant/${id}/timeline`)
      .then((r) => r.json())
      .then((d) => setEvents(d.timeline ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link
          href="/mission-control/tenants"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tenanci
        </Link>
        <div className="h-4 w-px bg-white/10" />
        <div>
          <h1 className="text-lg font-bold text-white">Oś czasu tenanta</h1>
          <p className="text-xs text-slate-500 font-mono">{id}</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm">Brak zdarzeń dla tego tenanta</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/5" />
          <div className="space-y-4">
            {events.map((evt, i) => (
              <div key={evt.eventId || i} className="relative flex gap-4 pl-0">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#080a12] border border-white/5 flex items-center justify-center flex-shrink-0 z-10">
                    <Clock className="w-4 h-4 text-violet-400" />
                  </div>
                </div>
                <div className="flex-1 bg-[#080a12] border border-white/5 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <span className="font-mono text-sm font-bold text-violet-300">{evt.eventType}</span>
                    <span className="text-[10px] text-slate-600 whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString('pl-PL')}
                    </span>
                  </div>
                  {evt.actor && (
                    <p className="text-xs text-slate-500 mb-1">
                      Aktor: <span className="text-slate-400">{evt.actor}</span>
                    </p>
                  )}
                  {evt.correlationId && (
                    <p className="text-[10px] text-slate-600 font-mono">
                      Korelacja: {evt.correlationId}
                    </p>
                  )}
                  {evt.payload && Object.keys(evt.payload).length > 0 && (
                    <pre className="mt-2 text-[10px] text-slate-600 bg-black/30 rounded-lg p-2 overflow-x-auto">
                      {JSON.stringify(evt.payload, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
