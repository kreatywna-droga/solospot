import { RuntimeDiagnostic } from '../model/TelemetryModel';
import { TelemetryAnalysisResult } from '../analyzer/ObservabilityAnalyzer';

export class DiagnosticsValidator {
  public static validatePerformance(analysis: TelemetryAnalysisResult): RuntimeDiagnostic[] {
    const diagnostics: RuntimeDiagnostic[] = [];

    if (analysis.avgLatencyMs > 50) {
      diagnostics.push({
        id: `diag_lat_${Math.random().toString(36).substring(2, 6)}`,
        code: 'PERF_AVG_LATENCY_EXCEEDED',
        severity: 'warning',
        message: `Average runtime latency (${analysis.avgLatencyMs} ms) exceeds target threshold of 50 ms.`,
      });
    }

    if (analysis.p95LatencyMs > 100) {
      diagnostics.push({
        id: `diag_p95_${Math.random().toString(36).substring(2, 6)}`,
        code: 'PERF_P95_LATENCY_EXCEEDED',
        severity: 'error',
        message: `P95 runtime latency (${analysis.p95LatencyMs} ms) exceeds max budget of 100 ms.`,
      });
    }

    if (analysis.errorSpansCount > 0) {
      diagnostics.push({
        id: `diag_err_${Math.random().toString(36).substring(2, 6)}`,
        code: 'RUNTIME_SPAN_ERROR',
        severity: 'error',
        message: `Detected ${analysis.errorSpansCount} execution spans with error status.`,
      });
    }

    return diagnostics;
  }
}
