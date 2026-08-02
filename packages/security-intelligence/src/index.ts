// ---------------------------------------------------------------------------
// Security Model — data contracts
// ---------------------------------------------------------------------------
export type {
  SecuritySeverity,
  SecurityCategory,
  SecurityFindingType,
  SecurityPolicy,
  SecurityFinding,
  SecurityRecommendation,
  SecurityFileSnapshot,
  SecurityAssessment,
  SecurityReport,
} from './model/SecurityModel';

// ---------------------------------------------------------------------------
// Security Analyzer
// ---------------------------------------------------------------------------
export { SecurityAnalyzer, DEFAULT_SECURITY_POLICIES } from './analyzer/SecurityAnalyzer';

// ---------------------------------------------------------------------------
// Security Validator
// ---------------------------------------------------------------------------
export { SecurityValidator } from './validator/SecurityValidator';
export type { SecurityMetric } from './validator/SecurityValidator';

// ---------------------------------------------------------------------------
// Security Report Generator
// ---------------------------------------------------------------------------
export { SecurityReportGenerator } from './report/SecurityReportGenerator';
export type { SecurityReportData } from './report/SecurityReportGenerator';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
export { SecurityCLI } from './cli/SecurityCLI';
export type {
  SecurityCLICommand,
  SecurityCLIFormat,
  SecurityCLIParseResult,
} from './cli/SecurityCLI';
