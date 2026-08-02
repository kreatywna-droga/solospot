// ---------------------------------------------------------------------------
// Documentation Model — data contracts
// ---------------------------------------------------------------------------
export type {
  DocumentationSeverity,
  DocumentationCategory,
  DocumentationIssueType,
  DocumentationSection,
  DocumentationArtifact,
  DocumentationIssue,
  DocumentationCoverage,
  DocumentationRecommendation,
  DocumentationAssessment,
  DocumentationReport,
} from './model/DocumentationModel';

// ---------------------------------------------------------------------------
// Documentation Analyzer
// ---------------------------------------------------------------------------
export { DocumentationAnalyzer } from './analyzer/DocumentationAnalyzer';

// ---------------------------------------------------------------------------
// Documentation Validator
// ---------------------------------------------------------------------------
export { DocumentationValidator } from './validator/DocumentationValidator';
export type { DocumentationMetric } from './validator/DocumentationValidator';

// ---------------------------------------------------------------------------
// Documentation Report Generator
// ---------------------------------------------------------------------------
export { DocumentationReportGenerator } from './report/DocumentationReportGenerator';
export type { DocumentationReportData } from './report/DocumentationReportGenerator';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
export { DocumentationCLI } from './cli/DocumentationCLI';
export type {
  DocumentationCLICommand,
  DocumentationCLIFormat,
  DocumentationCLIParseResult,
} from './cli/DocumentationCLI';
