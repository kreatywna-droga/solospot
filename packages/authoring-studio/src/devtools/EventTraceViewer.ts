/**
 * EventTraceViewer.ts — Sprint S1 Event Trace Viewer Model (ETAP 1)
 *
 * Event tracing data models for recording and visualizing studio event streams in DevTools.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface EventTraceEntry {
  readonly traceId: string;
  readonly eventName: string;
  readonly sourceModule: string;
  readonly payload: unknown;
  readonly timestamp: number;
}

export interface EventTraceLog {
  readonly traces: ReadonlyArray<EventTraceEntry>;
}

export function createEventTraceLog(initialTraces: ReadonlyArray<EventTraceEntry> = []): EventTraceLog {
  return {
    traces: [...initialTraces],
  };
}

export function appendEventTrace(
  log: EventTraceLog,
  eventName: string,
  sourceModule: string,
  payload: unknown
): EventTraceLog {
  const traceId = `trace-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const entry: EventTraceEntry = {
    traceId,
    eventName,
    sourceModule,
    payload,
    timestamp: Date.now(),
  };

  return {
    traces: [...log.traces, entry],
  };
}
