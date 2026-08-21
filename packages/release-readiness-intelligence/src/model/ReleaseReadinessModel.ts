// ---------------------------------------------------------------------------
// ReleaseSeverity — urgency of a detected release risk
// ---------------------------------------------------------------------------
export type ReleaseSeverity = 'info' | 'warning' | 'error' | 'critical';

// ---------------------------------------------------------------------------
// ReleaseStatus — overall verdict on release readiness
// ---------------------------------------------------------------------------
export type ReleaseStatus = 'Ready' | 'Conditionally Ready' | 'Not Ready';

// ---------------------------------------------------------------------------
// ReleaseGateCategory — domain area of a Quality Gate
// ---------------------------------------------------------------------------
export type ReleaseGateCategory =
  | 'architecture_freeze'
  | 'architecture_compliance'
  | 'public_api_stability'
  | 'configuration_completeness'
  | 'security_compliance'
  | 'performance_standards'
  | 'code_quality'
  | 'dependency_health'
  | 'documentation_completeness';

// ---------------------------------------------------------------------------
// ReleaseGate — definition of aQuality Gate required for release
// ---------------------------------------------------------------------------
export interface ReleaseGate {
  /** Unique gate ID (e.g. "GATE-001") */
  gateId: string;
  name: string;
  category: ReleaseGateCategory;
  /** Mandatory gates block the release if failed */
  isMandatory: boolean;
  /** Description of what this gate verifies */
  description: string;
}

// ---------------------------------------------------------------------------
// ReleaseGateResult — evaluation outcome of a single ReleaseGate
// ---------------------------------------------------------------------------
export interface ReleaseGateResult {
  gateId: string;
  gateName: string;
  category: ReleaseGateCategory;
  passed: boolean;
  isMandatory: boolean;
  score?: number;
  message: string;
  remediation?: string;
}

// ---------------------------------------------------------------------------
// ReleaseRisk — a single identified risk that threatens release stability
// ---------------------------------------------------------------------------
export interface ReleaseRisk {
  id: string;
  gateId?: string;
  category: ReleaseGateCategory;
  severity: ReleaseSeverity;
  title: string;
  description: string;
  /** Whether this risk is an absolute blocker for the release */
  isBlocker: boolean;
  targetArtifact?: string;
  mitigation?: string;
}

// ---------------------------------------------------------------------------
// ReleaseMetric — a quantitative indicator measured for release
// ---------------------------------------------------------------------------
export interface ReleaseMetric {
  metricName: string;
  value: number;
  targetValue: number;
  passing: boolean;
  unit?: string;
}

// ---------------------------------------------------------------------------
// ReleaseRecommendation — prioritised release action item
// ---------------------------------------------------------------------------
export interface ReleaseRecommendation {
  priority: number;
  category: ReleaseGateCategory;
  title: string;
  description: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// IntelligenceReportSnapshot — static summary snapshot of other Intelligence packages
// ---------------------------------------------------------------------------
export interface IntelligenceReportSnapshot {
  securityHealthScore?: number;
  securityCriticalCount?: number;
  architectureComplianceScore?: number;
  architectureCriticalCount?: number;
  apiHealthScore?: number;
  breakingChangeCount?: number;
  configHealthScore?: number;
  configMissingCount?: number;
  performanceHealthScore?: number;
  hotspotCount?: number;
  codeQualityHealthScore?: number;
  maintainabilityIndex?: number;
  dependencyHealthScore?: number;
  cycleCount?: number;
  documentationHealthScore?: number;
  readmeCoverageRate?: number;
}

// ---------------------------------------------------------------------------
// ReleaseSnapshot — repository snapshot used by the Release Readiness Analyzer
// ---------------------------------------------------------------------------
export interface ReleaseSnapshot {
  targetVersion: string;
  hasArchitectureFreezeDoc: boolean;
  isArchitectureFreezeApproved: boolean;
  hasRootReadme: boolean;
  unresolvedBlockersCount: number;
  intelligence: IntelligenceReportSnapshot;
  hasUnapprovedArchitectureFreeze?: boolean;
}

// ---------------------------------------------------------------------------
// ReleaseReadinessAssessment — aggregated result produced by the Validator
// ---------------------------------------------------------------------------
export interface ReleaseReadinessAssessment {
  totalGates: number;
  passedGateCount: number;
  failedGateCount: number;
  failedMandatoryGateCount: number;
  totalRisks: number;
  blockerRiskCount: number;
  overallStatus: ReleaseStatus;
  metrics: ReleaseMetric[];
  recommendations: ReleaseRecommendation[];
}

// ---------------------------------------------------------------------------
// ReleaseReport — full report produced by the Report Generator
// ---------------------------------------------------------------------------
export interface ReleaseReport {
  generatedAt: string;
  rootPath: string;
  targetVersion: string;
  /** Overall readiness score from 0 to 100 */
  releaseReadinessScore: number;
  /** Readiness status: 'Ready' | 'Conditionally Ready' | 'Not Ready' */
  status: ReleaseStatus;
  assessment: ReleaseReadinessAssessment;
  gateResults: ReleaseGateResult[];
  unfulfilledGates: ReleaseGateResult[];
  risks: ReleaseRisk[];
  recommendations: ReleaseRecommendation[];
}
