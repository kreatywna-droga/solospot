// Metrics Engine API
export { CodeMetricsEngine } from './metrics/CodeMetricsEngine';
export type { FileMetric, ProjectMetricsSummary } from './metrics/CodeMetricsEngine';

// Quality Analyzer API
export { QualityAnalyzer } from './quality/QualityAnalyzer';
export type {
  FindingSeverity,
  FindingCategory,
  QualityFinding,
} from './quality/QualityAnalyzer';

// Health Report Generator API
export { HealthReportGenerator } from './report/HealthReportGenerator';
export type { ProjectHealthReport } from './report/HealthReportGenerator';

// CLI API
export { ProjectHealthCLI } from './cli/ProjectHealthCLI';
export type { HealthCLICommand, HealthCLIParseResult } from './cli/ProjectHealthCLI';
