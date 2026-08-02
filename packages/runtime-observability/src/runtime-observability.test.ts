import { describe, it, expect } from 'vitest';
import {
  RuntimeSpan,
  ObservabilityAnalyzer,
  DiagnosticsValidator,
  ObservabilityReportGenerator,
  RuntimeObservabilityCLI,
} from './index';

describe('Runtime Observability Platform Unit Tests', () => {
  const sampleSpans: RuntimeSpan[] = [
    { id: 's1', name: 'render', startTimestamp: 1000, endTimestamp: 1020, durationMs: 20, status: 'ok' },
    { id: 's2', name: 'compile', startTimestamp: 1020, endTimestamp: 1080, durationMs: 60, status: 'ok' },
    { id: 's3', name: 'hydrate', startTimestamp: 1080, endTimestamp: 1200, durationMs: 120, status: 'error' },
  ];

  it('should analyze spans and calculate average / P95 latency', () => {
    const analysis = ObservabilityAnalyzer.analyzeSpans(sampleSpans);

    expect(analysis.totalSpans).toBe(3);
    expect(analysis.avgLatencyMs).toBe(67);
    expect(analysis.p95LatencyMs).toBe(120);
    expect(analysis.errorSpansCount).toBe(1);
  });

  it('should validate performance thresholds and generate diagnostics', () => {
    const analysis = ObservabilityAnalyzer.analyzeSpans(sampleSpans);
    const diagnostics = DiagnosticsValidator.validatePerformance(analysis);

    expect(diagnostics.length).toBe(3); // avg exceeded, p95 exceeded, error span
    expect(diagnostics.some(d => d.code === 'RUNTIME_SPAN_ERROR')).toBe(true);
  });

  it('should calculate Runtime Health Score and generate Markdown & JSON reports', () => {
    const analysis = ObservabilityAnalyzer.analyzeSpans(sampleSpans);
    const diagnostics = DiagnosticsValidator.validatePerformance(analysis);

    const report = ObservabilityReportGenerator.generateReport(analysis, diagnostics);
    expect(report.runtimeHealthScore).toBeLessThan(100);
    expect(report.healthStatus).toBeDefined();

    const md = ObservabilityReportGenerator.toMarkdown(report);
    expect(md).toContain('# Runtime Observability Analysis Report');
    expect(md).toContain('Runtime Health Score');

    const json = ObservabilityReportGenerator.toJSON(report);
    expect(json).toContain('"runtimeHealthScore"');
  });

  it('should parse CLI arguments correctly', () => {
    const parseRes = RuntimeObservabilityCLI.parseArgs(['validate', '--telemetry=telemetry.json']);
    expect(parseRes.command).toBe('validate');
    expect(parseRes.telemetryPath).toBe('telemetry.json');

    const help = RuntimeObservabilityCLI.getHelpText();
    expect(help).toContain('Usage: runtime-observability <command>');
  });
});
