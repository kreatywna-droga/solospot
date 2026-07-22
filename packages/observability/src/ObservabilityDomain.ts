export enum MetricType {
  CPU = 'cpu',
  MEMORY = 'memory',
  REQUEST_COUNT = 'request_count',
  REQUEST_DURATION = 'request_duration',
  ERROR_COUNT = 'error_count',
  CACHE_HIT = 'cache_hit',
  DATABASE_QUERIES = 'database_queries'
}

export interface Metric {
  id: string;
  type: MetricType;
  value: number;
  labels: Record<string, string>;
  timestamp: string;
}

export interface HealthCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  error?: string;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  correlationId: string;
  organizationId?: string;
}