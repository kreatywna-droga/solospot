// ---------------------------------------------------------------------------
// Compliance Model — data contracts
// ---------------------------------------------------------------------------
export type {
  ComplianceSeverity,
  ArchitectureLayer,
  ViolationType,
  ArchitectureRule,
  ArchitectureViolation,
  ComplianceMetric,
  ComplianceRecommendation,
  ModuleDescriptor,
  ComplianceAssessment,
  ComplianceReport,
} from './model/ComplianceModel';

// ---------------------------------------------------------------------------
// Compliance Analyzer
// ---------------------------------------------------------------------------
export { ComplianceAnalyzer, DEFAULT_ARCHITECTURE_RULES } from './analyzer/ComplianceAnalyzer';

// ---------------------------------------------------------------------------
// Compliance Validator
// ---------------------------------------------------------------------------
export { ComplianceValidator } from './validator/ComplianceValidator';

// ---------------------------------------------------------------------------
// Compliance Report Generator
// ---------------------------------------------------------------------------
export { ComplianceReportGenerator } from './report/ComplianceReportGenerator';
export type { ComplianceReportData } from './report/ComplianceReportGenerator';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
export { ComplianceCLI } from './cli/ComplianceCLI';
export type {
  ComplianceCLICommand,
  ComplianceCLIFormat,
  ComplianceCLIParseResult,
} from './cli/ComplianceCLI';
