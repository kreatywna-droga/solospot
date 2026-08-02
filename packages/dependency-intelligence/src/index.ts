// ---------------------------------------------------------------------------
// Dependency Model — data contracts
// ---------------------------------------------------------------------------
export type {
  DependencySeverity,
  DependencyCategory,
  DependencyIssueType,
  DependencyNode,
  DependencyEdge,
  DependencyMetric,
  DependencyIssue,
  DependencyRecommendation,
  DependencyAssessment,
  DependencyReport,
} from './model/DependencyModel';

// ---------------------------------------------------------------------------
// Dependency Analyzer
// ---------------------------------------------------------------------------
export { DependencyAnalyzer } from './analyzer/DependencyAnalyzer';

// ---------------------------------------------------------------------------
// Dependency Validator
// ---------------------------------------------------------------------------
export { DependencyValidator } from './validator/DependencyValidator';
export type { DependencyValidatorMetric } from './validator/DependencyValidator';

// ---------------------------------------------------------------------------
// Dependency Report Generator
// ---------------------------------------------------------------------------
export { DependencyReportGenerator } from './report/DependencyReportGenerator';
export type { DependencyReportData } from './report/DependencyReportGenerator';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
export { DependencyCLI } from './cli/DependencyCLI';
export type {
  DependencyCLICommand,
  DependencyCLIFormat,
  DependencyCLIParseResult,
} from './cli/DependencyCLI';
