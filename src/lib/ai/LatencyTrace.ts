/**
 * LatencyTrace.ts — CONTROLLED LATENCY INSTRUMENTATION (GATE v1.0 PHASE 1).
 *
 * TEMPORARY / CONTROLLED by design:
 * - Disabled by default. When disabled every method is a no-op and no object
 *   is allocated beyond the handle singleton, so the hot path is untouched.
 * - Enabled only by an explicit opt-in:
 *     localStorage.setItem('solospot.latency', '1')   (persists per browser)
 *     /studio?latency=1                               (per-navigation)
 *     window.__SOLOSPOT_LATENCY__ = true              (console toggle)
 * - Never mutates BuilderDocument, never changes routing, never replaces
 *   HacpBridge / SharedExecutionService. It only OBSERVES.
 *
 * Stage names mirror the GATE PHASE 2 latency table one-to-one:
 *   UI, INTENT_CLASSIFIER, ROUTER, PROVIDER, LLM, TOOL_SELECTION,
 *   HACP_BRIDGE, RESOLVER, BUILDER_COMMAND, DISPATCH, CANVAS,
 *   VERIFICATION, RESPONSE (+ QUEUE / FAST_PATH extras).
 *
 * Server-side stages are reported by /api/builder/copilot in `latency` and
 * merged into the trace via `setServerStages()`.
 */

export type LatencyStageName =
  | 'UI'
  | 'QUEUE'
  | 'INTENT_CLASSIFIER'
  | 'ROUTER'
  | 'PROVIDER'
  | 'LLM'
  | 'TOOL_SELECTION'
  | 'HACP_BRIDGE'
  | 'FAST_PATH'
  | 'RESOLVER'
  | 'BUILDER_COMMAND'
  | 'DISPATCH'
  | 'CANVAS'
  | 'VERIFICATION'
  | 'RESPONSE';

export interface LatencyStageRecord {
  stage: LatencyStageName;
  startMs: number;
  endMs: number;
  durationMs: number;
  detail?: string;
}

/** Server-reported breakdown (route.ts) merged into the client trace. */
export interface ServerLatencyBreakdown {
  totalMs?: number;
  toolSelectionMs?: number;
  intentClassifierMs?: number;
  routerMs?: number;
  modelMs?: number;
  llmMs?: number;
  llmRequestCount?: number;
  fallbackUsed?: boolean;
  controllerInjected?: boolean;
}

export type LatencyPath = 'AI_PATH' | 'FAST_PATH';

export interface LatencyTraceRecord {
  id: string;
  source: 'main-chat' | 'mini-inspector' | string;
  prompt: string;
  path: LatencyPath;
  startedAtIso: string;
  totalMs: number;
  stages: LatencyStageRecord[];
  server?: ServerLatencyBreakdown;
  notes: string[];
  ok: boolean;
  intent?: string;
  executionStatus?: string;
}

export interface LatencyTraceMeta {
  source: string;
  prompt: string;
}

export interface LatencyTraceHandle {
  readonly id: string;
  readonly enabled: boolean;
  stageStart(stage: LatencyStageName, at?: number): void;
  stageEnd(stage: LatencyStageName, at?: number, detail?: string): void;
  stageSync<T>(stage: LatencyStageName, fn: () => T, detail?: string): T;
  stageAsync<T>(stage: LatencyStageName, fn: () => Promise<T>, detail?: string): Promise<T>;
  setPath(path: LatencyPath): void;
  setServerStages(server: ServerLatencyBreakdown): void;
  note(text: string): void;
  setResultMeta(meta: { intent?: string; executionStatus?: string; ok?: boolean }): void;
  finish(extra?: { totalMs?: number }): LatencyTraceRecord | null;
}

// ---------------------------------------------------------------------------
// Opt-in switch
// ---------------------------------------------------------------------------

const LS_KEY = 'solospot.latency';
const QUERY_KEY = 'latency=1';
let cachedEnabled: boolean | null = null;

export function latencyTraceEnabled(): boolean {
  if (cachedEnabled !== null) return cachedEnabled;
  let on = false;
  try {
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LATENCY_TRACE === '1') on = true;
  } catch {
    /* no node env */
  }
  try {
    if (typeof window !== 'undefined') {
      if ((window as unknown as Record<string, unknown>).__SOLOSPOT_LATENCY__ === true) on = true;
      if (typeof window.localStorage !== 'undefined' && window.localStorage.getItem(LS_KEY) === '1') on = true;
      if (typeof window.location?.search === 'string' && window.location.search.includes(QUERY_KEY)) on = true;
    }
  } catch {
    /* storage blocked */
  }
  cachedEnabled = on;
  return on;
}

/** Test/bench helper — force the cached switch (used by benchmark harness). */
export function setLatencyTraceEnabled(on: boolean): void {
  cachedEnabled = on;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const RING_LIMIT = 100;
const records: LatencyTraceRecord[] = [];

function persist(record: LatencyTraceRecord): void {
  records.push(record);
  if (records.length > RING_LIMIT) records.splice(0, records.length - RING_LIMIT);
  try {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__SOLOSPOT_LATENCY_TRACES__ = [...records];
    }
  } catch {
    /* ignore */
  }
  try {
    console.log('[LATENCY_TRACE]', JSON.stringify(record));
  } catch {
    /* ignore */
  }
}

export function getLatencyTraces(): LatencyTraceRecord[] {
  return [...records];
}

export function clearLatencyTraces(): void {
  records.length = 0;
}

// ---------------------------------------------------------------------------
// Ambient pointer (nested stages inside HacpBridge/executeToolCall)
// ---------------------------------------------------------------------------

let ambient: LatencyTraceHandle | null = null;

export function currentLatencyTrace(): LatencyTraceHandle | null {
  return ambient;
}

export function withLatencyTrace<T>(trace: LatencyTraceHandle | null | undefined, fn: () => T): T {
  if (!trace || !trace.enabled) return fn();
  const prev = ambient;
  ambient = trace;
  try {
    return fn();
  } finally {
    ambient = prev;
  }
}

/** Async variant — keeps the ambient pointer for the whole awaited pipeline. */
export async function withLatencyTraceAsync<T>(
  trace: LatencyTraceHandle | null | undefined,
  fn: () => Promise<T>
): Promise<T> {
  if (!trace || !trace.enabled) return fn();
  const prev = ambient;
  ambient = trace;
  try {
    return await fn();
  } finally {
    ambient = prev;
  }
}

// ---------------------------------------------------------------------------
// No-op handle (disabled mode)
// ---------------------------------------------------------------------------

const NOOP: LatencyTraceHandle = {
  id: 'noop',
  enabled: false,
  stageStart() {},
  stageEnd() {},
  stageSync<T>(_: LatencyStageName, fn: () => T): T {
    return fn();
  },
  async stageAsync<T>(_: LatencyStageName, fn: () => Promise<T>): Promise<T> {
    return fn();
  },
  setPath() {},
  setServerStages() {},
  note() {},
  setResultMeta() {},
  finish() {
    return null;
  },
};

// ---------------------------------------------------------------------------
// Real handle
// ---------------------------------------------------------------------------

class RealTrace implements LatencyTraceHandle {
  readonly id: string;
  readonly enabled = true;
  private readonly source: string;
  private readonly prompt: string;
  private readonly startedAt: number;
  private readonly startedAtIso: string;
  private readonly stages: LatencyStageRecord[] = [];
  private readonly open = new Map<LatencyStageName, number>();
  private readonly notes: string[] = [];
  private server?: ServerLatencyBreakdown;
  private path: LatencyPath = 'AI_PATH';
  private intent?: string;
  private executionStatus?: string;
  private ok = true;

  constructor(meta: LatencyTraceMeta) {
    this.id = `lat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    this.source = meta.source;
    this.prompt = meta.prompt;
    this.startedAt = nowMs();
    this.startedAtIso = new Date().toISOString();
  }

  stageStart(stage: LatencyStageName, at?: number): void {
    if (this.open.has(stage)) return;
    this.open.set(stage, at ?? nowMs());
  }

  stageEnd(stage: LatencyStageName, at?: number, detail?: string): void {
    const start = this.open.get(stage);
    if (start === undefined) return;
    this.open.delete(stage);
    const end = at ?? nowMs();
    const durationMs = Math.max(0, end - start);
    // Merge repeated marks of the same stage (e.g. per-tool VERIFICATION).
    const existing = this.stages.find((s) => s.stage === stage);
    if (existing) {
      existing.durationMs += durationMs;
      existing.endMs = end;
      if (detail) existing.detail = detail;
      return;
    }
    this.stages.push({ stage, startMs: start, endMs: end, durationMs, detail });
  }

  stageSync<T>(stage: LatencyStageName, fn: () => T, detail?: string): T {
    const start = nowMs();
    try {
      return fn();
    } finally {
      this.record(stage, start, nowMs(), detail);
    }
  }

  async stageAsync<T>(stage: LatencyStageName, fn: () => Promise<T>, detail?: string): Promise<T> {
    const start = nowMs();
    try {
      return await fn();
    } finally {
      this.record(stage, start, nowMs(), detail);
    }
  }

  private record(stage: LatencyStageName, start: number, end: number, detail?: string): void {
    const durationMs = Math.max(0, end - start);
    const existing = this.stages.find((s) => s.stage === stage);
    if (existing) {
      existing.durationMs += durationMs;
      existing.endMs = end;
      if (detail) existing.detail = detail;
      return;
    }
    this.stages.push({ stage, startMs: start, endMs: end, durationMs, detail });
  }

  setPath(path: LatencyPath): void {
    this.path = path;
  }

  setServerStages(server: ServerLatencyBreakdown): void {
    if (!server) return;
    this.server = { ...(this.server || {}), ...server };
    const map: Array<[LatencyStageName, number | undefined]> = [
      ['TOOL_SELECTION', server.toolSelectionMs],
      ['INTENT_CLASSIFIER', server.intentClassifierMs],
      ['ROUTER', server.routerMs],
      ['LLM', server.llmMs ?? server.modelMs],
    ];
    for (const [stage, ms] of map) {
      if (typeof ms !== 'number' || !isFinite(ms)) continue;
      const existing = this.stages.find((s) => s.stage === stage);
      if (existing) {
        existing.durationMs = ms;
        existing.endMs = existing.startMs + ms;
      } else {
        this.stages.push({ stage, startMs: 0, endMs: ms, durationMs: ms, detail: 'server' });
      }
    }
  }

  note(text: string): void {
    if (this.notes.length < 20) this.notes.push(text);
  }

  setResultMeta(meta: { intent?: string; executionStatus?: string; ok?: boolean }): void {
    if (meta.intent) this.intent = meta.intent;
    if (meta.executionStatus) this.executionStatus = meta.executionStatus;
    if (typeof meta.ok === 'boolean') this.ok = meta.ok;
  }

  finish(extra?: { totalMs?: number }): LatencyTraceRecord | null {
    // Close any stage left open so a thrown error never drops it silently.
    for (const stage of [...this.open.keys()]) this.stageEnd(stage);
    const totalMs = extra?.totalMs ?? Math.max(0, nowMs() - this.startedAt);
    const record: LatencyTraceRecord = {
      id: this.id,
      source: this.source,
      prompt: this.prompt,
      path: this.path,
      startedAtIso: this.startedAtIso,
      totalMs,
      stages: this.stages.map((s) => ({ ...s })),
      server: this.server ? { ...this.server } : undefined,
      notes: [...this.notes],
      ok: this.ok,
      intent: this.intent,
      executionStatus: this.executionStatus,
    };
    persist(record);
    return record;
  }
}

function nowMs(): number {
  try {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now();
  } catch {
    /* ignore */
  }
  return Date.now();
}

/**
 * Begin an instrumentation trace. Returns a no-op handle when the switch is
 * off, so callers can invoke it unconditionally on every command.
 */
export function beginLatencyTrace(meta: LatencyTraceMeta): LatencyTraceHandle {
  if (!latencyTraceEnabled()) return NOOP;
  return new RealTrace(meta);
}

export const NOOP_LATENCY_TRACE = NOOP;

/**
 * Close CANVAS (dispatch → commit → paint) and emit the record.
 * Falls back to an immediate finish when rAF is unavailable or tracing is off.
 */
export function finishTraceWithCanvas(trace: LatencyTraceHandle): void {
  if (!trace || !trace.enabled || typeof requestAnimationFrame !== 'function') {
    trace?.finish();
    return;
  }
  trace.stageStart('CANVAS');
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      trace.stageEnd('CANVAS');
      trace.finish();
    })
  );
}
