export type MetricUnit = 'ms' | 'bytes' | 'fps' | 'count';
export type DiagnosticSeverity = 'info' | 'warning' | 'error';
export type HealthStatus = 'healthy' | 'degraded' | 'critical';

export interface RuntimeMetric {
  name: string;
  value: number;
  unit: MetricUnit;
  timestamp: string;
}

export interface RuntimeEvent {
  id: string;
  name: string;
  category: string;
  timestamp: string;
  payload?: Record<string, any>;
}

export interface RuntimeSpan {
  id: string;
  name: string;
  startTimestamp: number;
  endTimestamp: number;
  durationMs: number;
  status: 'ok' | 'error';
}

export interface RuntimeTrace {
  traceId: string;
  rootSpan: RuntimeSpan;
  spans: RuntimeSpan[];
}

export interface RuntimeSnapshot {
  timestamp: string;
  activeTracesCount: number;
  memoryUsageMb?: number;
  queueLength: number;
}

export interface RuntimeHealth {
  score: number;
  status: HealthStatus;
}

export interface RuntimeDiagnostic {
  id: string;
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  traceId?: string;
}
