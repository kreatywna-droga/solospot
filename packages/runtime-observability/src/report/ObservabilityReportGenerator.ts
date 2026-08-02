import { TelemetryAnalysisResult } from '../analyzer/ObservabilityAnalyzer';
import { RuntimeDiagnostic, HealthStatus } from '../model/TelemetryModel';

export interface ObservabilityReportData {
  timestamp: string;
  runtimeHealthScore: number;
  healthStatus: HealthStatus;
  analysis: TelemetryAnalysisResult;
  diagnostics: RuntimeDiagnostic[];
  recommendations: string[];
}

export class ObservabilityReportGenerator {
  public static calculateHealthScore(analysis: TelemetryAnalysisResult, diagnostics: RuntimeDiagnostic[]): number {
    let score = 100;
    if (analysis.avgLatencyMs > 50) score -= 15;
    if (analysis.p95LatencyMs > 100) score -= 25;
    score -= analysis.errorSpansCount * 10;
    return Math.max(0, Math.min(100, score));
  }

  public static getHealthStatus(score: number): HealthStatus {
    if (score >= 85) return 'healthy';
    if (score >= 60) return 'degraded';
    return 'critical';
  }

  public static generateReport(
    analysis: TelemetryAnalysisResult,
    diagnostics: RuntimeDiagnostic[]
  ): ObservabilityReportData {
    const runtimeHealthScore = ObservabilityReportGenerator.calculateHealthScore(analysis, diagnostics);
    const healthStatus = ObservabilityReportGenerator.getHealthStatus(runtimeHealthScore);

    const recommendations: string[] = [];
    if (analysis.avgLatencyMs > 50) {
      recommendations.push('Optimize main execution pipeline to keep average latency below 50 ms.');
    }
    if (analysis.errorSpansCount > 0) {
      recommendations.push('Investigate and fix telemetry spans reporting execution errors.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Runtime execution performance and observability metrics are optimal.');
    }

    return {
      timestamp: new Date().toISOString(),
      runtimeHealthScore,
      healthStatus,
      analysis,
      diagnostics,
      recommendations,
    };
  }

  public static toMarkdown(data: ObservabilityReportData): string {
    const lines: string[] = [];

    lines.push('# Runtime Observability Analysis Report');
    lines.push('');
    lines.push(`- **Timestamp:** \`${data.timestamp}\``);
    lines.push(`- **Runtime Health Score:** **${data.runtimeHealthScore} / 100** (Status: **${data.healthStatus.toUpperCase()}**)`);
    lines.push(`- **Total Spans Analyzed:** ${data.analysis.totalSpans}`);
    lines.push(`- **Average Latency:** ${data.analysis.avgLatencyMs} ms`);
    lines.push(`- **P95 Latency:** ${data.analysis.p95LatencyMs} ms`);
    lines.push(`- **Error Spans:** ${data.analysis.errorSpansCount}`);
    lines.push('');

    lines.push('## Recommendations');
    lines.push('');
    for (const r of data.recommendations) {
      lines.push(`- 💡 ${r}`);
    }
    lines.push('');

    if (data.diagnostics.length > 0) {
      lines.push('## Diagnostic Warnings & Errors');
      lines.push('');
      lines.push('| Code | Severity | Message |');
      lines.push('|------|----------|---------|');
      for (const d of data.diagnostics) {
        lines.push(`| \`${d.code}\` | **${d.severity.toUpperCase()}** | ${d.message} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  public static toJSON(data: ObservabilityReportData): string {
    return JSON.stringify(data, null, 2);
  }
}
