import { Metric, MetricType, HealthCheck, TraceContext } from './ObservabilityDomain';

export class MetricsEngine {
  private metrics: Map<string, Metric[]> = new Map();

  record(type: MetricType, value: number, labels: Record<string, string> = {}): void {
    const metric: Metric = {
      id: `metric-${Date.now()}`,
      type,
      value,
      labels,
      timestamp: new Date().toISOString()
    };

    const existing = this.metrics.get(type) || [];
    existing.push(metric);
    this.metrics.set(type, existing);
  }

  getMetrics(type: MetricType, since?: string): Metric[] {
    const all = this.metrics.get(type) || [];
    return since ? all.filter(m => m.timestamp >= since) : all;
  }

  getSummary(type: MetricType): { avg: number; min: number; max: number; count: number } {
    const metrics = this.getMetrics(type);
    if (metrics.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };

    const values = metrics.map(m => m.value);
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }
}