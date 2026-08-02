// ---------------------------------------------------------------------------
// Performance Model — data contracts
// ---------------------------------------------------------------------------
export type {
  PerformanceSeverity,
  PerformanceCategory,
  PerformanceIssueType,
  PerformanceMetric,
  PerformanceIssue,
  PerformanceRecommendation,
  PerformanceModuleSnapshot,
  PerformanceAssessment,
  PerformanceReport,
} from './model/PerformanceModel';

// ---------------------------------------------------------------------------
// Performance Analyzer
// ---------------------------------------------------------------------------
export { PerformanceAnalyzer } from './analyzer/PerformanceAnalyzer';

// ---------------------------------------------------------------------------
// Performance Validator
// ---------------------------------------------------------------------------
export { PerformanceValidator } from './validator/PerformanceValidator';

// ---------------------------------------------------------------------------
// Performance Report Generator
// ---------------------------------------------------------------------------
export { PerformanceReportGenerator } from './report/PerformanceReportGenerator';
export type { PerformanceReportData } from './report/PerformanceReportGenerator';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
export { PerformanceCLI } from './cli/PerformanceCLI';
export type {
  PerformanceCLICommand,
  PerformanceCLIFormat,
  PerformanceCLIParseResult,
} from './cli/PerformanceCLI';
