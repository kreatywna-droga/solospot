// ---------------------------------------------------------------------------
// Repository Model — data contracts
// ---------------------------------------------------------------------------
export type {
  RepositorySeverity,
  RepositoryIssueType,
  RepositoryNode,
  RepositoryStructure,
  RepositoryIssue,
  RepositoryMetric,
  RepositoryAssessment,
  RepositoryReport,
} from './model/RepositoryModel';

// ---------------------------------------------------------------------------
// Repository Analyzer
// ---------------------------------------------------------------------------
export { RepositoryAnalyzer } from './analyzer/RepositoryAnalyzer';

// ---------------------------------------------------------------------------
// Repository Validator
// ---------------------------------------------------------------------------
export { RepositoryValidator } from './validator/RepositoryValidator';

// ---------------------------------------------------------------------------
// Repository Report Generator
// ---------------------------------------------------------------------------
export { RepositoryReportGenerator } from './report/RepositoryReportGenerator';
export type { RepositoryReportData } from './report/RepositoryReportGenerator';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
export { RepositoryIntelligenceCLI } from './cli/RepositoryIntelligenceCLI';
export type {
  RepositoryCLICommand,
  RepositoryCLIFormat,
  RepositoryCLIParseResult,
} from './cli/RepositoryIntelligenceCLI';
