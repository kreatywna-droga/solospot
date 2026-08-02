import { RuntimeSpan, RuntimeTrace, RuntimeMetric } from '../model/TelemetryModel';

export interface TelemetryAnalysisResult {
  totalSpans: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  slowSpansCount: number;
  errorSpansCount: number;
}

export class ObservabilityAnalyzer {
  public static calculateAverageLatency(spans: RuntimeSpan[]): number {
    if (spans.length === 0) return 0;
    const sum = spans.reduce((acc, s) => acc + s.durationMs, 0);
    return Math.round(sum / spans.length);
  }

  public static calculateP95Latency(spans: RuntimeSpan[]): number {
    if (spans.length === 0) return 0;
    const sorted = [...spans].sort((a, b) => a.durationMs - b.durationMs);
    const index = Math.floor(sorted.length * 0.95);
    return Math.round(sorted[index].durationMs);
  }

  public static analyzeSpans(spans: RuntimeSpan[]): TelemetryAnalysisResult {
    const totalSpans = spans.length;
    const avgLatencyMs = ObservabilityAnalyzer.calculateAverageLatency(spans);
    const p95LatencyMs = ObservabilityAnalyzer.calculateP95Latency(spans);
    const slowSpansCount = spans.filter(s => s.durationMs > 50).length;
    const errorSpansCount = spans.filter(s => s.status === 'error').length;

    return {
      totalSpans,
      avgLatencyMs,
      p95LatencyMs,
      slowSpansCount,
      errorSpansCount,
    };
  }
}
