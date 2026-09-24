/**
 * Observability.ts — Structural logging for Design Brain autonomous phases.
 * Never logs secrets, credentials, or sensitive user data (section 48).
 */

import type { ObservabilityEvent, ObservabilityKind } from './types';

type Listener = (event: ObservabilityEvent) => void;

const listeners: Listener[] = [];
const buffer: ObservabilityEvent[] = [];
const MAX_BUFFER = 500;

export function onObservability(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function emitObservability(
  kind: ObservabilityKind,
  phase: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  const event: ObservabilityEvent = {
    kind,
    phase,
    message,
    data: data ? sanitize(data) : undefined,
    timestamp: new Date().toISOString(),
  };
  buffer.push(event);
  if (buffer.length > MAX_BUFFER) buffer.shift();
  for (const fn of listeners) {
    try { fn(event); } catch { /* listener errors must not break brain */ }
  }
  // Structured console line for E2E / forensics (no secrets).
  console.log(`[DesignBrain:${kind}] ${phase} — ${message}`);
}

export function getObservabilityBuffer(): readonly ObservabilityEvent[] {
  return buffer;
}

export function clearObservabilityBuffer(): void {
  buffer.length = 0;
}

const FORBIDDEN_KEYS = /secret|token|password|credential|apikey|api_key|authorization/i;

function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (FORBIDDEN_KEYS.test(k)) continue;
    if (typeof v === 'string' && v.length > 500) {
      out[k] = v.slice(0, 500) + '…';
    } else {
      out[k] = v;
    }
  }
  return out;
}
