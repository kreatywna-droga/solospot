// ---------------------------------------------------------------------------
// NormalizedSeverity — unified severity across all Intelligence modules
// ---------------------------------------------------------------------------
export type NormalizedSeverity = 'info' | 'warning' | 'error' | 'critical';

// ---------------------------------------------------------------------------
// PlatformGrade — overall health rating for the platform
// ---------------------------------------------------------------------------
export type PlatformGrade = 'Excellent' | 'Good' | 'Fair' | 'Poor';

// ---------------------------------------------------------------------------
// HealthTrendStatus — PM8/PM10 Trend Direction Classification
// ---------------------------------------------------------------------------
export type HealthTrendStatus = 'improving' | 'stable' | 'degrading';

// ---------------------------------------------------------------------------
// PM13 Runtime Cache & Performance Health Models
// ---------------------------------------------------------------------------
export interface RuntimeCacheHealthModel {
  cacheHealthScore: number;
  cacheHitRatioPercent: number;
  cacheMissRatioPercent: number;
  pipelineExecutionStatus: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  partialRenderingStatus: 'OPTIMAL' | 'SUB_OPTIMAL' | 'DISABLED';
}

// ---------------------------------------------------------------------------
// PM12 Subsystem & Runtime Feature Status Types
// ---------------------------------------------------------------------------
export type FeatureLifecycleStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETE';

export interface RuntimeSubsystemStatus {
  subsystem: 'runtime_pipeline' | 'runtime_preview' | 'runtime_cache' | 'partial_rendering';
  title: string;
  status: FeatureLifecycleStatus;
  score: number;
}

// ---------------------------------------------------------------------------
// PM11 Architecture Decision Traceability Contracts
// ---------------------------------------------------------------------------
export type DecisionStatus = 'APPROVED' | 'IN_PROGRESS' | 'DEPRECATED' | 'PROPOSED';

export interface DecisionReference {
  adrId: string;
  title: string;
  documentPath: string;
  status: DecisionStatus;
}

export interface DecisionImpact {
  affectedSubsystem: SubsystemProductModule | 'builder_core' | 'runtime_core' | 'commerce_engine';
  qualityGateId: string;
  freezeDocumentPath?: string;
}

export interface ArchitectureDecision {
  id: string;
  adrId: string;
  title: string;
  sprintId: string;
  subsystem: SubsystemProductModule;
  documentationPath: string;
  qualityGateIds: string[];
  freezeApproved: boolean;
  status: DecisionStatus;
}

export interface DecisionTrace {
  adrId: string;
  sprintId: string;
  subsystem: SubsystemProductModule;
  qualityGates: string[];
  freezeDocument: string;
  releaseGate: string;
  isTraceComplete: boolean;
}

export interface TraceabilityReport {
  generatedAt: string;
  totalADRs: number;
  mappedADRsCount: number;
  adrCoveragePercent: number;
  freezeCoveragePercent: number;
  releaseGateCoveragePercent: number;
  documentationCoveragePercent: number;
  traces: DecisionTrace[];
}

// ---------------------------------------------------------------------------
// PM10 CLIPresetProfile & AuditDomainPreset
// ---------------------------------------------------------------------------
export type CLIPresetProfile = 'developer' | 'ci' | 'release' | 'hotfix' | 'production';

export type AuditDomainPreset =
  | 'Builder Audit'
  | 'Runtime Audit'
  | 'Commerce Audit'
  | 'Security Audit'
  | 'Performance Audit';

// ---------------------------------------------------------------------------
// PM9/PM10 Baseline & Benchmarking Contracts
// ---------------------------------------------------------------------------
export interface BaselineMetric {
  metricName: string;
  baselineValue: number;
  currentValue: number;
  deviation: number;
  isRegressed: boolean;
}

export interface BaselineDeviation {
  module: IntelligenceModule | SubsystemProductModule;
  description: string;
  severity: NormalizedSeverity;
}

export interface BaselineComparison {
  metricName: string;
  baselineScore: number;
  currentScore: number;
  delta: number;
  status: HealthTrendStatus;
}

export interface PlatformBaseline {
  baselineId: string;
  timestamp: string;
  targetSprint: string;
  overallHealthScore: number;
  moduleScores: Record<IntelligenceModule, number>;
}

export interface BaselineAssessment {
  baselineId: string;
  comparisons: BaselineComparison[];
  deviations: BaselineDeviation[];
  newRegressionsCount: number;
  resolvedRegressionsCount: number;
  architectureDriftDetected: boolean;
  releaseDriftDetected: boolean;
  qualityDriftDetected: boolean;
  stabilityIndex: number;
  bestSprintId: string;
  worstSprintId: string;
  averageSprintScore: number;
}

// ---------------------------------------------------------------------------
// TrendPoint & TrendSummary — PM8/PM10 Historical Quality Trend Contracts
// ---------------------------------------------------------------------------
export interface TrendPoint {
  timestamp: string;
  sprintId: string;
  metricName: string;
  value: number;
}

export interface TrendSummary {
  metricName: string;
  currentValue: number;
  previousValue: number;
  delta: number;
  status: HealthTrendStatus;
}

export interface ThreeWayTrendComparison {
  metricName: string;
  previousSprintScore: number;
  currentSprintScore: number;
  baselineScore: number;
  previousVsCurrentDelta: number;
  baselineVsCurrentDelta: number;
  overallStatus: HealthTrendStatus;
}

export interface RiskEvolutionSummary {
  newRisksCount: number;
  resolvedRisksCount: number;
  unchangedRisksCount: number;
  escalatingRisksCount: number;
}

// ---------------------------------------------------------------------------
// ExecutiveStatusState — PM7/PM8/PM9/PM10/PM12 Executive Status Model
// ---------------------------------------------------------------------------
export type ExecutiveStatusState = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'READY' | 'IN_PROGRESS';

export interface ExecutiveStatusModel {
  platformStatus: ExecutiveStatusState;
  productStatus: ExecutiveStatusState;
  architectureStatus: ExecutiveStatusState;
  releaseStatus: ExecutiveStatusState;
  qualityStatus: ExecutiveStatusState;
  averageRecentHealthScore: number;
  approvedFreezeCount: number;
  releasePassCount: number;
  regressionFreeSprintCount: number;
  completedSprintCount: number;
  productProgressPercent: number;
}

// ---------------------------------------------------------------------------
// AuditPreset & AuditProfileIdentifier
// ---------------------------------------------------------------------------
export type AuditPreset =
  | 'QUICK_AUDIT'
  | 'FULL_AUDIT'
  | 'RELEASE_AUDIT'
  | 'ARCHITECTURE_AUDIT'
  | 'PRODUCT_AUDIT';

export type AuditProfileIdentifier =
  | 'Sprint6BProfile'
  | 'Sprint6CProfile'
  | 'Sprint6DProfile'
  | 'Sprint7Profile'
  | 'ProductionProfile';

export interface AuditProfileDefinition {
  profileId: AuditProfileIdentifier;
  name: string;
  targetSprint: string;
  preset: AuditPreset;
  requiredModules: IntelligenceModule[];
  mandatoryGateIds: string[];
  minimumHealthScore: number;
  description: string;
}

// ---------------------------------------------------------------------------
// IntelligenceModule — enum identifier for integrated Intelligence packages
// ---------------------------------------------------------------------------
export type IntelligenceModule =
  | 'repository'
  | 'configuration'
  | 'api_surface'
  | 'performance'
  | 'architecture_compliance'
  | 'documentation'
  | 'security'
  | 'code_quality'
  | 'dependency'
  | 'release_readiness';

// ---------------------------------------------------------------------------
// SubsystemProductModule — Product Engineering subsystems tracked by Orchestrator
// ---------------------------------------------------------------------------
export type SubsystemProductModule =
  | 'smart_guides'
  | 'constraint_engine'
  | 'responsive_engine'
  | 'inspector_2'
  | 'runtime_pipeline'
  | 'runtime_preview'
  | 'runtime_cache'
  | 'partial_rendering';

export interface SubsystemStatus {
  subsystem: SubsystemProductModule;
  title: string;
  isImplemented: boolean;
  isFreezeApproved: boolean;
  score: number;
  blockingIssuesCount: number;
  lifecycleStatus?: FeatureLifecycleStatus;
  registryStatus?: string;
  panelStatus?: string;
  syncStatus?: string;
}

// ---------------------------------------------------------------------------
// SprintTimelineEntry — Historical and Planned Sprint Health Timeline
// ---------------------------------------------------------------------------
export interface SprintTimelineEntry {
  sprintId: string;
  sprintName: string;
  isCompleted: boolean;
  healthScore: number;
  architectureStatus: 'APPROVED' | 'IN_PROGRESS' | 'PLANNED';
  releaseStatus: 'READY' | 'CONDITIONALLY_READY' | 'NOT_READY' | 'PLANNED';
  regressionCount: number;
}

// ---------------------------------------------------------------------------
// RiskCorrelationNode — Cross-module Risk Correlation Link
// ---------------------------------------------------------------------------
export interface RiskCorrelationNode {
  id: string;
  primaryRiskId: string;
  primaryModule: IntelligenceModule | SubsystemProductModule;
  correlatedRiskId: string;
  correlatedModule: IntelligenceModule | SubsystemProductModule;
  correlationType: 'architecture_to_release' | 'dependency_to_security' | 'api_to_release';
  impactDescription: string;
}

// ---------------------------------------------------------------------------
// IntelligenceResult — aggregated result snapshot from one Intelligence module
// ---------------------------------------------------------------------------
export interface IntelligenceResult {
  module: IntelligenceModule;
  moduleName: string;
  healthScore: number;
  grade: string;
  totalIssues: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  summaryMessage?: string;
  rawIssues?: Array<{
    id: string;
    message: string;
    targetPath?: string;
    severity: string;
  }>;
}

// ---------------------------------------------------------------------------
// PlatformHealthMetric — quantitative metric spanning across modules
// ---------------------------------------------------------------------------
export interface PlatformHealthMetric {
  metricName: string;
  module: IntelligenceModule | SubsystemProductModule;
  value: number;
  targetValue: number;
  passing: boolean;
  unit?: string;
}

// ---------------------------------------------------------------------------
// PlatformRisk — unified platform risk derived from module findings
// ---------------------------------------------------------------------------
export interface PlatformRisk {
  id: string;
  module: IntelligenceModule | SubsystemProductModule;
  severity: NormalizedSeverity;
  title: string;
  description: string;
  targetPath?: string;
  isSystemic: boolean;
  mitigation?: string;
}

// ---------------------------------------------------------------------------
// PlatformRecommendation — merged prioritised recommendation
// ---------------------------------------------------------------------------
export interface PlatformRecommendation {
  priority: number;
  modules: Array<IntelligenceModule | SubsystemProductModule>;
  title: string;
  description: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// PlatformSnapshot — aggregated snapshot of all Intelligence module results + Subsystems
// ---------------------------------------------------------------------------
export interface PlatformSnapshot {
  timestamp: string;
  rootPath: string;
  results: Record<IntelligenceModule, IntelligenceResult>;
  subsystems: Record<SubsystemProductModule, SubsystemStatus>;
  timeline: SprintTimelineEntry[];
  totalModuleCount: number;
  activeModuleCount: number;
}

// ---------------------------------------------------------------------------
// PlatformAssessment — aggregated verdict produced by PlatformValidator
// ---------------------------------------------------------------------------
export interface PlatformAssessment {
  overallScore: number;
  grade: PlatformGrade;
  totalIssues: number;
  totalCriticalCount: number;
  totalErrorCount: number;
  totalWarningCount: number;
  totalInfoCount: number;
  executiveStatus: ExecutiveStatusModel;
  activeProfile?: AuditProfileDefinition;
  trends: TrendSummary[];
  threeWayTrends?: ThreeWayTrendComparison[];
  riskEvolution: RiskEvolutionSummary;
  baselineAssessment?: BaselineAssessment;
  traceabilityReport?: TraceabilityReport;
  runtimeCacheHealth?: RuntimeCacheHealthModel;
  metrics: PlatformHealthMetric[];
  subsystemStatuses: SubsystemStatus[];
  timelineEntries: SprintTimelineEntry[];
  riskCorrelations: RiskCorrelationNode[];
  risks: PlatformRisk[];
  recommendations: PlatformRecommendation[];
}

// ---------------------------------------------------------------------------
// PlatformReport — final report produced by PlatformReportGenerator
// ---------------------------------------------------------------------------
export interface PlatformReport {
  generatedAt: string;
  rootPath: string;
  platformHealthScore: number;
  grade: PlatformGrade;
  assessment: PlatformAssessment;
  moduleSummaries: IntelligenceResult[];
  subsystemSummaries: SubsystemStatus[];
  timelineSummaries: SprintTimelineEntry[];
  trendSummaries: TrendSummary[];
  threeWayTrends?: ThreeWayTrendComparison[];
  riskEvolution: RiskEvolutionSummary;
  baselineAssessment?: BaselineAssessment;
  traceabilityReport?: TraceabilityReport;
  runtimeCacheHealth?: RuntimeCacheHealthModel;
  riskCorrelations: RiskCorrelationNode[];
  risks: PlatformRisk[];
  recommendations: PlatformRecommendation[];
}
