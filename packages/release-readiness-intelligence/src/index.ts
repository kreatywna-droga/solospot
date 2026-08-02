// ---------------------------------------------------------------------------
// Release Readiness Model — data contracts
// ---------------------------------------------------------------------------
export type {
  ReleaseSeverity,
  ReleaseStatus,
  ReleaseGateCategory,
  ReleaseGate,
  ReleaseGateResult,
  ReleaseRisk,
  ReleaseMetric,
  ReleaseRecommendation,
  IntelligenceReportSnapshot,
  ReleaseSnapshot,
  ReleaseReadinessAssessment,
  ReleaseReport,
} from './model/ReleaseReadinessModel';

// ---------------------------------------------------------------------------
// Release Readiness Analyzer
// ---------------------------------------------------------------------------
export { ReleaseReadinessAnalyzer, DEFAULT_RELEASE_GATES } from './analyzer/ReleaseReadinessAnalyzer';

// ---------------------------------------------------------------------------
// Release Readiness Validator
// ---------------------------------------------------------------------------
export { ReleaseReadinessValidator } from './validator/ReleaseReadinessValidator';

// ---------------------------------------------------------------------------
// Release Readiness Report Generator
// ---------------------------------------------------------------------------
export { ReleaseReadinessReportGenerator } from './report/ReleaseReadinessReportGenerator';
export type { ReleaseReportData } from './report/ReleaseReadinessReportGenerator';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
export { ReleaseReadinessCLI } from './cli/ReleaseReadinessCLI';
export type {
  ReleaseReadinessCLICommand,
  ReleaseReadinessCLIFormat,
  ReleaseReadinessCLIParseResult,
} from './cli/ReleaseReadinessCLI';
