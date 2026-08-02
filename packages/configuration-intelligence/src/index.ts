// ---------------------------------------------------------------------------
// Configuration Model — data contracts
// ---------------------------------------------------------------------------
export type {
  ConfigurationSeverity,
  ConfigurationToolType,
  ConfigurationIssueType,
  ConfigurationArtifact,
  ConfigurationFile,
  ConfigurationIssue,
  ConfigurationMetric,
  ConfigurationAssessment,
  ConfigurationReport,
} from './model/ConfigurationModel';

// ---------------------------------------------------------------------------
// Configuration Analyzer
// ---------------------------------------------------------------------------
export { ConfigurationAnalyzer } from './analyzer/ConfigurationAnalyzer';

// ---------------------------------------------------------------------------
// Configuration Validator
// ---------------------------------------------------------------------------
export { ConfigurationValidator } from './validator/ConfigurationValidator';

// ---------------------------------------------------------------------------
// Configuration Report Generator
// ---------------------------------------------------------------------------
export { ConfigurationReportGenerator } from './report/ConfigurationReportGenerator';
export type { ConfigurationReportData } from './report/ConfigurationReportGenerator';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
export { ConfigurationIntelligenceCLI } from './cli/ConfigurationIntelligenceCLI';
export type {
  ConfigurationCLICommand,
  ConfigurationCLIFormat,
  ConfigurationCLIParseResult,
} from './cli/ConfigurationIntelligenceCLI';
