import type {
  AuditProfileDefinition,
  AuditProfileIdentifier,
  ExecutiveStatusModel,
  IntelligenceModule,
  IntelligenceResult,
  NormalizedSeverity,
  PlatformRisk,
  PlatformSnapshot,
  RiskCorrelationNode,
  SprintTimelineEntry,
  SubsystemProductModule,
  SubsystemStatus,
} from '../model/PlatformIntelligenceModel';

// ---------------------------------------------------------------------------
// Ready-to-use Audit Profiles (PM7 Task 1 & 2)
// ---------------------------------------------------------------------------
export const REGISTERED_AUDIT_PROFILES: Record<AuditProfileIdentifier, AuditProfileDefinition> = {
  Sprint6BProfile: {
    profileId: 'Sprint6BProfile',
    name: 'Smart Guides Foundation Audit Profile',
    targetSprint: 'Sprint 6B',
    preset: 'PRODUCT_AUDIT',
    requiredModules: ['architecture_compliance', 'release_readiness', 'code_quality', 'api_surface', 'documentation'],
    mandatoryGateIds: ['ALIGNMENT_ENGINE_COMPLETE', 'SMART_SPACING_COMPLETE', 'DISTANCE_INDICATORS_COMPLETE', 'GRID_SNAPPING_COMPLETE', 'SMART_GUIDES_FREEZE_APPROVED', 'NO_CANVAS_DOMAIN_LOGIC', 'NO_RUNTIME_COUPLING'],
    minimumHealthScore: 80,
    description: 'Validates Smart Guides overlay isolation, PreviewChannel postMessage sync, and zero domain logic in canvas.',
  },
  Sprint6CProfile: {
    profileId: 'Sprint6CProfile',
    name: 'Constraint Engine Audit Profile',
    targetSprint: 'Sprint 6C',
    preset: 'PRODUCT_AUDIT',
    requiredModules: ['architecture_compliance', 'release_readiness', 'code_quality', 'performance'],
    mandatoryGateIds: ['CONSTRAINT_MODEL_COMPLETE', 'CONSTRAINT_SOLVER_COMPLETE', 'CONSTRAINT_INSPECTOR_COMPLETE', 'CONSTRAINT_RUNTIME_COMPLETE', 'CONSTRAINT_FREEZE_APPROVED', 'NO_LAYOUT_REGRESSION'],
    minimumHealthScore: 80,
    description: 'Validates Constraint Engine pure solver functions, CSS variable mapping, and zero DOM API access.',
  },
  Sprint6DProfile: {
    profileId: 'Sprint6DProfile',
    name: 'Responsive Engine Audit Profile',
    targetSprint: 'Sprint 6D',
    preset: 'PRODUCT_AUDIT',
    requiredModules: ['architecture_compliance', 'release_readiness', 'code_quality', 'api_surface'],
    mandatoryGateIds: ['RESPONSIVE_MODEL_COMPLETE', 'BREAKPOINT_ENGINE_COMPLETE', 'RESPONSIVE_INSPECTOR_COMPLETE', 'RESPONSIVE_RUNTIME_COMPLETE', 'RESPONSIVE_FREEZE_APPROVED', 'NO_BREAKPOINT_REGRESSION'],
    minimumHealthScore: 80,
    description: 'Validates viewport breakpoint resolution, mobile-first media query output, and zero layout drift.',
  },
  Sprint7Profile: {
    profileId: 'Sprint7Profile',
    name: 'Inspector 2.0 Audit Profile',
    targetSprint: 'Sprint 7',
    preset: 'PRODUCT_AUDIT',
    requiredModules: ['architecture_compliance', 'release_readiness', 'api_surface', 'code_quality', 'documentation'],
    mandatoryGateIds: ['INSPECTOR_CORE_COMPLETE', 'PROPERTY_PANEL_COMPLETE', 'PROPERTY_REGISTRY_COMPLETE', 'PROPERTY_SYNC_COMPLETE', 'INSPECTOR_FREEZE_APPROVED', 'NO_REGISTRY_REGRESSION'],
    minimumHealthScore: 80,
    description: 'Validates Component Registry dynamic form field rendering, accordion shell, and Command Bus property updates.',
  },
  ProductionProfile: {
    profileId: 'ProductionProfile',
    name: 'Monorepo Production Release Audit Profile',
    targetSprint: 'Sprint 9 (Production Release)',
    preset: 'RELEASE_AUDIT',
    requiredModules: [
      'repository', 'configuration', 'api_surface', 'performance',
      'architecture_compliance', 'documentation', 'security',
      'code_quality', 'dependency', 'release_readiness',
    ],
    mandatoryGateIds: [
      'GATE-001', 'GATE-002', 'GATE-003', 'GATE-004', 'GATE-005',
      'NO_REGRESSION_BUILDER', 'NO_PUBLIC_API_BREAKING_CHANGES',
    ],
    minimumHealthScore: 90,
    description: 'Comprehensive 10-module release candidate audit verifying zero critical security, dependency, or architecture flaws.',
  },
};

// Module weights for Overall Platform Health Score calculation
const MODULE_WEIGHTS: Record<IntelligenceModule, number> = {
  release_readiness: 0.20,
  security: 0.15,
  architecture_compliance: 0.15,
  api_surface: 0.10,
  dependency: 0.10,
  code_quality: 0.10,
  performance: 0.05,
  configuration: 0.05,
  documentation: 0.05,
  repository: 0.05,
};

export const DEFAULT_SUBSYSTEM_STATUSES: Record<SubsystemProductModule, SubsystemStatus> = {
  smart_guides: {
    subsystem: 'smart_guides',
    title: 'Sprint 6B — Smart Guides Subsystem',
    isImplemented: false,
    isFreezeApproved: false,
    score: 0,
    blockingIssuesCount: 0,
  },
  constraint_engine: {
    subsystem: 'constraint_engine',
    title: 'Sprint 6C — Constraint Engine Subsystem',
    isImplemented: false,
    isFreezeApproved: false,
    score: 0,
    blockingIssuesCount: 0,
  },
  responsive_engine: {
    subsystem: 'responsive_engine',
    title: 'Sprint 6D — Responsive Engine Subsystem',
    isImplemented: false,
    isFreezeApproved: false,
    score: 0,
    blockingIssuesCount: 0,
  },
  inspector_2: {
    subsystem: 'inspector_2',
    title: 'Sprint 7 — Inspector 2.0 Subsystem',
    isImplemented: false,
    isFreezeApproved: false,
    score: 0,
    blockingIssuesCount: 0,
    registryStatus: 'HEALTHY',
    panelStatus: 'PLANNED',
    syncStatus: 'STANDBY',
  },
  runtime_pipeline: {
    subsystem: 'runtime_pipeline',
    title: 'Sprint 6 Step 5 — Runtime Pipeline',
    isImplemented: true,
    isFreezeApproved: true,
    score: 98,
    blockingIssuesCount: 0,
    lifecycleStatus: 'COMPLETE',
  },
  runtime_preview: {
    subsystem: 'runtime_preview',
    title: 'Sprint 6 Step 5 — Builder Runtime Preview',
    isImplemented: true,
    isFreezeApproved: true,
    score: 97,
    blockingIssuesCount: 0,
    lifecycleStatus: 'COMPLETE',
  },
  runtime_cache: {
    subsystem: 'runtime_cache',
    title: 'Sprint 6 Step 5 — Runtime Render Cache',
    isImplemented: true,
    isFreezeApproved: true,
    score: 96,
    blockingIssuesCount: 0,
    lifecycleStatus: 'COMPLETE',
  },
  partial_rendering: {
    subsystem: 'partial_rendering',
    title: 'Sprint 6 Step 5 — Incremental & Partial Rendering',
    isImplemented: true,
    isFreezeApproved: true,
    score: 96,
    blockingIssuesCount: 0,
    lifecycleStatus: 'COMPLETE',
  },
};

export const DEFAULT_SPRINT_TIMELINE: SprintTimelineEntry[] = [
  { sprintId: 'Sprint 5A',   sprintName: 'Canvas Foundation Core', isCompleted: true,  healthScore: 98, architectureStatus: 'APPROVED', releaseStatus: 'READY', regressionCount: 0 },
  { sprintId: 'Sprint 5B.1', sprintName: 'Layout Engine',         isCompleted: true,  healthScore: 97, architectureStatus: 'APPROVED', releaseStatus: 'READY', regressionCount: 0 },
  { sprintId: 'Sprint 5B.2', sprintName: 'Grid Engine',           isCompleted: true,  healthScore: 96, architectureStatus: 'APPROVED', releaseStatus: 'READY', regressionCount: 0 },
  { sprintId: 'Sprint 5B.3', sprintName: 'Overflow Engine',       isCompleted: true,  healthScore: 96, architectureStatus: 'APPROVED', releaseStatus: 'READY', regressionCount: 0 },
  { sprintId: 'Sprint 5B.4', sprintName: 'Border & Radius Engine',isCompleted: true,  healthScore: 97, architectureStatus: 'APPROVED', releaseStatus: 'READY', regressionCount: 0 },
  { sprintId: 'Sprint 5C',   sprintName: 'Studio Foundation Pass', isCompleted: true,  healthScore: 98, architectureStatus: 'APPROVED', releaseStatus: 'READY', regressionCount: 0 },
  { sprintId: 'Sprint 6A',   sprintName: 'Drag & Drop Foundation',isCompleted: true,  healthScore: 96, architectureStatus: 'APPROVED', releaseStatus: 'READY', regressionCount: 0 },
  { sprintId: 'Sprint 6B',   sprintName: 'Smart Guides Foundation',isCompleted: false, healthScore: 0,  architectureStatus: 'IN_PROGRESS', releaseStatus: 'CONDITIONALLY_READY', regressionCount: 0 },
  { sprintId: 'Sprint 6C',   sprintName: 'Constraint Engine',      isCompleted: false, healthScore: 0,  architectureStatus: 'PLANNED', releaseStatus: 'PLANNED', regressionCount: 0 },
  { sprintId: 'Sprint 6D',   sprintName: 'Responsive Engine',      isCompleted: false, healthScore: 0,  architectureStatus: 'PLANNED', releaseStatus: 'PLANNED', regressionCount: 0 },
  { sprintId: 'Sprint 7',    sprintName: 'Inspector 2.0',          isCompleted: false, healthScore: 0,  architectureStatus: 'PLANNED', releaseStatus: 'PLANNED', regressionCount: 0 },
];

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

export class PlatformOrchestrator {

  public static normalizeSeverity(severityStr: string): NormalizedSeverity {
    const s = severityStr.toLowerCase();
    if (s.includes('crit') || s.includes('block')) return 'critical';
    if (s.includes('err') || s.includes('fail')) return 'error';
    if (s.includes('warn')) return 'warning';
    return 'info';
  }

  public static deriveExecutiveStatus(snapshot: PlatformSnapshot): ExecutiveStatusModel {
    const score = PlatformOrchestrator.calculatePlatformScore(snapshot);
    const archRes = snapshot.results.architecture_compliance;
    const secRes = snapshot.results.security;
    const relRes = snapshot.results.release_readiness;

    const platformStatus = score >= 90 ? 'HEALTHY' : score >= 75 ? 'WARNING' : 'CRITICAL';
    const productStatus = 'IN_PROGRESS';
    const architectureStatus = (archRes?.criticalCount ?? 0) === 0 ? 'HEALTHY' : 'CRITICAL';
    const releaseStatus = (relRes?.healthScore ?? 100) >= 90 ? 'READY' : 'WARNING';
    const qualityStatus = (secRes?.criticalCount ?? 0) === 0 ? 'HEALTHY' : 'CRITICAL';

    const completed = snapshot.timeline.filter((s) => s.isCompleted);
    const averageRecentHealthScore = completed.length > 0
      ? Math.round(completed.reduce((sum, s) => sum + s.healthScore, 0) / completed.length)
      : 97;

    const approvedFreezeCount = completed.filter((s) => s.architectureStatus === 'APPROVED').length;
    const releasePassCount = completed.filter((s) => s.releaseStatus === 'READY').length;
    const regressionFreeSprintCount = completed.filter((s) => s.regressionCount === 0).length;
    const completedSprintCount = completed.length;
    const productProgressPercent = Math.round((completedSprintCount / snapshot.timeline.length) * 100);

    return {
      platformStatus,
      productStatus,
      architectureStatus,
      releaseStatus,
      qualityStatus,
      averageRecentHealthScore,
      approvedFreezeCount,
      releasePassCount,
      regressionFreeSprintCount,
      completedSprintCount,
      productProgressPercent,
    };
  }

  public static aggregateReports(
    resultsList: IntelligenceResult[],
    subsystemOverrides: Partial<Record<SubsystemProductModule, Partial<SubsystemStatus>>> = {},
    rootPath = '.'
  ): PlatformSnapshot {
    const resultsMap = {} as Record<IntelligenceModule, IntelligenceResult>;

    for (const res of resultsList) {
      resultsMap[res.module] = res;
    }

    const subsystemsMap: Record<SubsystemProductModule, SubsystemStatus> = {
      smart_guides: { ...DEFAULT_SUBSYSTEM_STATUSES.smart_guides, ...(subsystemOverrides.smart_guides ?? {}) },
      constraint_engine: { ...DEFAULT_SUBSYSTEM_STATUSES.constraint_engine, ...(subsystemOverrides.constraint_engine ?? {}) },
      responsive_engine: { ...DEFAULT_SUBSYSTEM_STATUSES.responsive_engine, ...(subsystemOverrides.responsive_engine ?? {}) },
      inspector_2: { ...DEFAULT_SUBSYSTEM_STATUSES.inspector_2, ...(subsystemOverrides.inspector_2 ?? {}) },
      runtime_pipeline: { ...DEFAULT_SUBSYSTEM_STATUSES.runtime_pipeline, ...(subsystemOverrides.runtime_pipeline ?? {}) },
      runtime_preview: { ...DEFAULT_SUBSYSTEM_STATUSES.runtime_preview, ...(subsystemOverrides.runtime_preview ?? {}) },
      runtime_cache: { ...DEFAULT_SUBSYSTEM_STATUSES.runtime_cache, ...(subsystemOverrides.runtime_cache ?? {}) },
      partial_rendering: { ...DEFAULT_SUBSYSTEM_STATUSES.partial_rendering, ...(subsystemOverrides.partial_rendering ?? {}) },
    };

    return {
      timestamp: new Date().toISOString(),
      rootPath,
      results: resultsMap,
      subsystems: subsystemsMap,
      timeline: DEFAULT_SPRINT_TIMELINE,
      totalModuleCount: Object.keys(MODULE_WEIGHTS).length,
      activeModuleCount: resultsList.length,
    };
  }

  public static calculatePlatformScore(snapshot: PlatformSnapshot): number {
    let totalWeight = 0;
    let weightedScoreSum = 0;

    for (const [mod, weight] of Object.entries(MODULE_WEIGHTS) as Array<[IntelligenceModule, number]>) {
      const res = snapshot.results[mod];
      if (res && typeof res.healthScore === 'number') {
        weightedScoreSum += res.healthScore * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) return 100;
    const finalScore = weightedScoreSum / totalWeight;
    return Math.max(0, Math.min(100, Math.round(finalScore)));
  }

  public static correlateCrossModuleRisks(snapshot: PlatformSnapshot): RiskCorrelationNode[] {
    const correlations: RiskCorrelationNode[] = [];
    const archRes = snapshot.results.architecture_compliance;
    const relRes = snapshot.results.release_readiness;
    const depRes = snapshot.results.dependency;
    const secRes = snapshot.results.security;

    if (archRes && relRes && archRes.criticalCount > 0) {
      correlations.push({
        id: makeId('corr'),
        primaryRiskId: 'RSK-ARCH-CRIT',
        primaryModule: 'architecture_compliance',
        correlatedRiskId: 'RSK-REL-BLOCK',
        correlatedModule: 'release_readiness',
        correlationType: 'architecture_to_release',
        impactDescription: `Critical Architecture violation directly blocks Release Readiness Approval.`,
      });
    }

    if (depRes && secRes && depRes.criticalCount > 0) {
      correlations.push({
        id: makeId('corr'),
        primaryRiskId: 'RSK-DEP-CYCLE',
        primaryModule: 'dependency',
        correlatedRiskId: 'RSK-SEC-DEPS',
        correlatedModule: 'security',
        correlationType: 'dependency_to_security',
        impactDescription: `Circular dependencies increase supply chain attack surface and untracked code paths.`,
      });
    }

    return correlations;
  }

  public static deduplicateIssues(snapshot: PlatformSnapshot): PlatformRisk[] {
    const risks: PlatformRisk[] = [];
    const seenKeys = new Set<string>();

    for (const [mod, res] of Object.entries(snapshot.results) as Array<[IntelligenceModule, IntelligenceResult]>) {
      if (!res.rawIssues) continue;

      for (const issue of res.rawIssues) {
        const normSev = PlatformOrchestrator.normalizeSeverity(issue.severity);
        const key = `${issue.targetPath ?? ''}::${issue.message.substring(0, 40)}`;

        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          risks.push({
            id: makeId('plt_risk'),
            module: mod,
            severity: normSev,
            title: `[${mod.toUpperCase()}] ${issue.message.substring(0, 60)}`,
            description: issue.message,
            targetPath: issue.targetPath,
            isSystemic: normSev === 'critical' || normSev === 'error',
            mitigation: `Refer to ${res.moduleName} report for fix guidelines.`,
          });
        }
      }
    }

    return risks;
  }
}
