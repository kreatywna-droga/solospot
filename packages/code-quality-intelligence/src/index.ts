// ---------------------------------------------------------------------------
// Code Quality Model — data contracts
// ---------------------------------------------------------------------------
export type {
  CodeQualitySeverity,
  CodeQualityCategory,
  CodeQualityIssueType,
  CodeQualityMetric,
  CodeQualityIssue,
  CodeQualityRecommendation,
  CodeQualityFileSnapshot,
  CodeQualityAssessment,
  CodeQualityReport,
} from './model/CodeQualityModel';

// ---------------------------------------------------------------------------
// Code Quality Analyzer
// ---------------------------------------------------------------------------
export { CodeQualityAnalyzer } from './analyzer/CodeQualityAnalyzer';

// ---------------------------------------------------------------------------
// Code Quality Validator
// ---------------------------------------------------------------------------
export { CodeQualityValidator } from './validator/CodeQualityValidator';

// ---------------------------------------------------------------------------
// Code Quality Report Generator
// ---------------------------------------------------------------------------
export { CodeQualityReportGenerator } from './report/CodeQualityReportGenerator';
export type { CodeQualityReportData } from './report/CodeQualityReportGenerator';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
export { CodeQualityCLI } from './cli/CodeQualityCLI';
export type {
  CodeQualityCLICommand,
  CodeQualityCLIFormat,
  CodeQualityCLIParseResult,
} from './cli/CodeQualityCLI';
