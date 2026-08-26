/**
 * Telemetry.ts — PM45 Telemetry & Diagnostics Observation Layer (ETAP 7)
 *
 * DECISION-094: Telemetry i Diagnostics są wyłącznie pasywną warstwą obserwacji.
 *
 * Telemetry metric definitions, passive telemetry event collection, and diagnostics snapshot.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export interface TelemetryMetric {
  readonly metricId: string;
  readonly name: string;
  readonly value: number;
  readonly unit: 'ms' | 'count' | 'bytes';
  readonly timestamp: number;
}

export interface TelemetryEvent {
  readonly eventId: string;
  readonly category: 'performance' | 'usage' | 'error' | 'workflow';
  readonly name: string;
  readonly attributes: Record<string, unknown>;
  readonly timestamp: number;
}

export interface DiagnosticsSnapshot {
  readonly snapshotId: string;
  readonly studioVersion: string;
  readonly activeMetricCount: number;
  readonly collectedEventsCount: number;
  readonly generatedAt: number;
}

export interface TelemetryStoreState {
  readonly metrics: ReadonlyArray<TelemetryMetric>;
  readonly events: ReadonlyArray<TelemetryEvent>;
}

export function createTelemetryStoreState(): TelemetryStoreState {
  return { metrics: [], events: [] };
}

export function recordTelemetryMetric(
  state: TelemetryStoreState,
  name: string,
  value: number,
  unit: 'ms' | 'count' | 'bytes' = 'count'
): TelemetryStoreState {
  const metric: TelemetryMetric = {
    metricId: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    value,
    unit,
    timestamp: Date.now(),
  };
  return { ...state, metrics: [...state.metrics, metric] };
}

export function createDiagnosticsSnapshot(
  state: TelemetryStoreState,
  studioVersion: string = '1.0.0'
): DiagnosticsSnapshot {
  return {
    snapshotId: `diag-${Date.now()}`,
    studioVersion,
    activeMetricCount: state.metrics.length,
    collectedEventsCount: state.events.length,
    generatedAt: Date.now(),
  };
}
