// Security Model API
//
// @deprecated This package is DEPRECATED as of G1-298 (ETAP 10).
// Use `security-intelligence` instead, which has the same classes plus
// 11+ checks including `postMessage("*")`, JWT detection, and more.
// This package is scheduled for REMOVAL in a future ETAP.
export { DEFAULT_SECURITY_POLICY } from './model/SecurityModel';
export type {
  SecuritySeverity,
  SecurityCategory,
  SecurityFinding,
  SecurityPolicy,
  SecurityRisk,
  SecurityAssessment,
} from './model/SecurityModel';

// Security Analyzer API
export { SecurityAnalyzer } from './analyzer/SecurityAnalyzer';

// Security Validator API
export { SecurityValidator } from './validator/SecurityValidator';

// Report Generator API
export { SecurityReportGenerator } from './report/SecurityReportGenerator';
export type { SecurityReportData } from './report/SecurityReportGenerator';

// CLI API
export { PlatformSecurityCLI } from './cli/PlatformSecurityCLI';
export type { SecCLICommand, SecCLIParseResult } from './cli/PlatformSecurityCLI';
