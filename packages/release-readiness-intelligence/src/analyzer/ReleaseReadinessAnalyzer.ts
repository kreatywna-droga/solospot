import type {
  IntelligenceReportSnapshot,
  ReleaseGate,
  ReleaseGateCategory,
  ReleaseRisk,
  ReleaseSeverity,
  ReleaseSnapshot,
} from '../model/ReleaseReadinessModel';

// ---------------------------------------------------------------------------
// Default Mandatory Quality Gates for Release
// Extended with Sprint PM1, PM3, PM4, PM5, PM12, PM13 & 6B/6C/6D/7 Quality Gates
// ---------------------------------------------------------------------------
export const DEFAULT_RELEASE_GATES: ReleaseGate[] = [
  {
    gateId: 'GATE-001',
    name: 'Architecture Freeze Specification Approved',
    category: 'architecture_freeze',
    isMandatory: true,
    description: 'Architecture Freeze document must exist and be formally APPROVED.',
  },
  {
    gateId: 'GATE-002',
    name: 'Public API Stability (Zero Unhandled Breaking Changes)',
    category: 'public_api_stability',
    isMandatory: true,
    description: 'Public API surface must not contain unhandled breaking changes or missing barrels.',
  },
  {
    gateId: 'GATE-003',
    name: 'Configuration Completeness',
    category: 'configuration_completeness',
    isMandatory: true,
    description: 'All packages must have valid and consistent configuration files (tsconfig, package.json).',
  },
  {
    gateId: 'GATE-004',
    name: 'Zero Critical Security Findings',
    category: 'security_compliance',
    isMandatory: true,
    description: 'Zero critical security findings or unhandled secrets allowed in the release snapshot.',
  },
  {
    gateId: 'GATE-005',
    name: 'Zero Dependency Cycles',
    category: 'dependency_health',
    isMandatory: true,
    description: 'The dependency graph must be free of circular package dependencies.',
  },
  {
    gateId: 'GATE-006',
    name: 'Performance Standards Compliance',
    category: 'performance_standards',
    isMandatory: false,
    description: 'Performance Health Score must be >= 80.',
  },
  {
    gateId: 'GATE-007',
    name: 'Documentation Standards & Coverage',
    category: 'documentation_completeness',
    isMandatory: false,
    description: 'Documentation Health Score must be >= 80.',
  },

  // -------------------------------------------------------------------------
  // Sprint PM1 / 6B Smart Guides Quality Gates
  // -------------------------------------------------------------------------
  {
    gateId: 'ALIGNMENT_ENGINE_COMPLETE',
    name: 'Alignment Engine Implementation Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Edge and center alignment line calculations must be pure functions and pass unit tests.',
  },
  {
    gateId: 'SMART_SPACING_COMPLETE',
    name: 'Smart Spacing Detection Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Equal spacing calculations between sibling components must be verified.',
  },
  {
    gateId: 'DISTANCE_INDICATORS_COMPLETE',
    name: 'Distance Indicators Presentation Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Pixel distance indicators overlay rendering must pass visual presentation checks.',
  },
  {
    gateId: 'GRID_SNAPPING_COMPLETE',
    name: 'Grid Snapping Calculation Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Grid threshold snapping must operate deterministically without DOM mutation.',
  },
  {
    gateId: 'SMART_GUIDES_FREEZE_APPROVED',
    name: 'Smart Guides Architecture Freeze Approved',
    category: 'architecture_freeze',
    isMandatory: true,
    description: 'Smart Guides Architecture Freeze specification must be formally APPROVED.',
  },
  {
    gateId: 'NO_CANVAS_DOMAIN_LOGIC',
    name: 'Zero Domain Logic inside Canvas Overlay',
    category: 'architecture_compliance',
    isMandatory: true,
    description: 'Canvas overlay layer must contain zero business/calculation logic.',
  },
  {
    gateId: 'NO_RUNTIME_COUPLING',
    name: 'Zero Direct Coupling between Snap Engine & Runtime',
    category: 'architecture_compliance',
    isMandatory: true,
    description: 'Snap Engine must communicate with Runtime Preview strictly via PreviewChannel postMessage protocol.',
  },

  // -------------------------------------------------------------------------
  // Sprint PM3 / 6C Constraint Engine Quality Gates
  // -------------------------------------------------------------------------
  {
    gateId: 'CONSTRAINT_MODEL_COMPLETE',
    name: 'Constraint Data Model Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Constraint types (pinning, stretch, anchors, min/max bounds) must be fully specified.',
  },
  {
    gateId: 'CONSTRAINT_SOLVER_COMPLETE',
    name: 'Constraint Solver Pure Functions Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Constraint solving algorithms must pass 100% unit tests without DOM access.',
  },
  {
    gateId: 'CONSTRAINT_INSPECTOR_COMPLETE',
    name: 'Constraint Inspector Controls Binding Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Inspector UI control fields for constraints must bind seamlessly to Command Bus.',
  },
  {
    gateId: 'CONSTRAINT_RUNTIME_COMPLETE',
    name: 'Constraint Runtime CSS Propagation Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Constraint style objects must propagate to PreviewChannel and render without layout jump.',
  },
  {
    gateId: 'CONSTRAINT_FREEZE_APPROVED',
    name: 'Constraint Engine Architecture Freeze Approved',
    category: 'architecture_freeze',
    isMandatory: true,
    description: 'Constraint Engine Architecture Freeze specification must be formally APPROVED.',
  },
  {
    gateId: 'NO_LAYOUT_REGRESSION',
    name: 'Zero Layout Engine Regressions',
    category: 'code_quality',
    isMandatory: true,
    description: 'Applying constraints must not regress existing Flexbox and Grid layout engines.',
  },

  // -------------------------------------------------------------------------
  // Sprint PM4 / 6D Responsive Engine Quality Gates
  // -------------------------------------------------------------------------
  {
    gateId: 'RESPONSIVE_MODEL_COMPLETE',
    name: 'Responsive Data Model & Schema Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Viewport breakpoint schemas and media query contracts must be fully specified.',
  },
  {
    gateId: 'BREAKPOINT_ENGINE_COMPLETE',
    name: 'Breakpoint Resolver Engine Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Breakpoint resolution algorithms must pass 100% unit tests deterministically.',
  },
  {
    gateId: 'RESPONSIVE_INSPECTOR_COMPLETE',
    name: 'Responsive Inspector Breakpoint Controls Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Inspector breakpoint switcher controls must dispatch standard commands.',
  },
  {
    gateId: 'RESPONSIVE_RUNTIME_COMPLETE',
    name: 'Responsive Media Query CSS Runtime Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Media query style rules must propagate via PreviewChannel and apply without visual flicker.',
  },
  {
    gateId: 'RESPONSIVE_FREEZE_APPROVED',
    name: 'Responsive Engine Architecture Freeze Approved',
    category: 'architecture_freeze',
    isMandatory: true,
    description: 'Responsive Engine Architecture Freeze specification must be formally APPROVED.',
  },
  {
    gateId: 'NO_BREAKPOINT_REGRESSION',
    name: 'Zero Breakpoint Switch Regressions',
    category: 'code_quality',
    isMandatory: true,
    description: 'Switching between Desktop, Tablet, and Mobile viewports must preserve state without layout drift.',
  },

  // -------------------------------------------------------------------------
  // Sprint PM5 / Sprint 7 Inspector 2.0 Quality Gates
  // -------------------------------------------------------------------------
  {
    gateId: 'INSPECTOR_CORE_COMPLETE',
    name: 'Inspector 2.0 Core Panel Modular Shell Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Inspector 2.0 accordion panel shell and modular section architecture must be fully implemented.',
  },
  {
    gateId: 'PROPERTY_PANEL_COMPLETE',
    name: 'Property Accordion Panels Implementation Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Layout, Typography, Grid, Border, and Constraint panels must render schemas dynamically.',
  },
  {
    gateId: 'PROPERTY_REGISTRY_COMPLETE',
    name: 'Component Registry Dynamic Form Rendering Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Form fields must generate dynamically from Component Registry manifests without hardcoding.',
  },
  {
    gateId: 'PROPERTY_SYNC_COMPLETE',
    name: 'Property Update Synchronization Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Editing property inputs must dispatch UPDATE_PROPS commands and sync with PreviewChannel cleanly.',
  },
  {
    gateId: 'INSPECTOR_FREEZE_APPROVED',
    name: 'Inspector 2.0 Architecture Freeze Approved',
    category: 'architecture_freeze',
    isMandatory: true,
    description: 'Inspector 2.0 Architecture Freeze specification must be formally APPROVED.',
  },
  {
    gateId: 'NO_REGISTRY_REGRESSION',
    name: 'Zero Component Registry Regressions',
    category: 'code_quality',
    isMandatory: true,
    description: 'Upgrading Inspector controls must preserve 100% Component Registry manifest definitions.',
  },

  // -------------------------------------------------------------------------
  // Sprint PM12 / PM13 Runtime & Performance Quality Gates
  // -------------------------------------------------------------------------
  {
    gateId: 'RUNTIME_PIPELINE_COMPLETE',
    name: 'Runtime Pipeline Execution Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Unified renderStore() execution pipeline must execute deterministically across all output modes.',
  },
  {
    gateId: 'RUNTIME_PREVIEW_COMPLETE',
    name: 'Builder Preview Mode Synchronization Complete',
    category: 'code_quality',
    isMandatory: true,
    description: 'Builder Canvas and StoreRuntimeEngine must sync seamlessly in PREVIEW output mode.',
  },
  {
    gateId: 'RUNTIME_CACHE_COMPLETE',
    name: 'Runtime Cache Optimization Complete',
    category: 'performance_standards',
    isMandatory: false,
    description: 'Runtime render cache acceleration layer must operate without mutating domain state.',
  },
  {
    gateId: 'PARTIAL_RENDERING_COMPLETE',
    name: 'Partial & Incremental Rendering Complete',
    category: 'performance_standards',
    isMandatory: false,
    description: 'Incremental section rendering updates must apply without full document re-evaluations.',
  },
  {
    gateId: 'NO_RUNTIME_REGRESSION',
    name: 'Zero Runtime Core Regressions',
    category: 'code_quality',
    isMandatory: true,
    description: 'Upgrading runtime pipeline must preserve 100% backward compatibility with existing store routes.',
  },
  {
    gateId: 'RUNTIME_CACHE_VALIDATED',
    name: 'Runtime Render Cache Acceleration Validated',
    category: 'performance_standards',
    isMandatory: true,
    description: 'Runtime render cache hit ratio must exceed 85% with zero stale payload pollution.',
  },
  {
    gateId: 'PREVIEW_RUNTIME_VALIDATED',
    name: 'Preview Channel Real-Time Sync Validated',
    category: 'code_quality',
    isMandatory: true,
    description: 'Preview runtime postMessage channel must handle LIVE/PREVIEW updates under 16ms latency.',
  },
  {
    gateId: 'PIPELINE_STAGE_COMPLETENESS',
    name: 'Pipeline Execution Stage Order Preserved',
    category: 'code_quality',
    isMandatory: true,
    description: 'Pipeline stages (cache-check, validate-access, legacy-fallback, cache-write) execute sequentially.',
  },
  {
    gateId: 'PARTIAL_RENDERING_VALIDATED',
    name: 'Partial & Incremental Section Render Validated',
    category: 'performance_standards',
    isMandatory: true,
    description: 'Partial section rendering must re-evaluate individual DOM sections without full page teardown.',
  },
  {
    gateId: 'NO_PERFORMANCE_REGRESSION',
    name: 'Zero Performance Latency Regressions',
    category: 'performance_standards',
    isMandatory: true,
    description: 'Adding runtime cache and preview channels must not regress total page render time.',
  },

  // -------------------------------------------------------------------------
  // Core Platform Stability Gates
  // -------------------------------------------------------------------------
  {
    gateId: 'NO_REGRESSION_BUILDER',
    name: 'Zero Builder Core Regressions',
    category: 'code_quality',
    isMandatory: true,
    description: 'All 10 frozen Studio Foundation subsystems must pass regression checks without contract violations.',
  },
  {
    gateId: 'NO_PUBLIC_API_BREAKING_CHANGES',
    name: 'Zero Public API Breaking Changes Across Monorepo',
    category: 'public_api_stability',
    isMandatory: true,
    description: 'No exported symbol, function signature, or contract may break backward compatibility.',
  },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

function risk(
  prefix: string,
  category: ReleaseGateCategory,
  severity: ReleaseSeverity,
  title: string,
  description: string,
  isBlocker: boolean,
  opts: { gateId?: string; targetArtifact?: string; mitigation?: string } = {}
): ReleaseRisk {
  return {
    id: makeId(prefix),
    category,
    severity,
    title,
    description,
    isBlocker,
    ...opts,
  };
}

// ---------------------------------------------------------------------------
// ReleaseReadinessAnalyzer — static, read-only release readiness analyzer
// ---------------------------------------------------------------------------
export class ReleaseReadinessAnalyzer {

  public static parseSnapshot(
    rawSnapshot: Partial<ReleaseSnapshot>
  ): ReleaseSnapshot {
    const intel: IntelligenceReportSnapshot = rawSnapshot.intelligence ?? {};
    return {
      targetVersion: rawSnapshot.targetVersion ?? '1.0.0',
      hasArchitectureFreezeDoc: rawSnapshot.hasArchitectureFreezeDoc ?? true,
      isArchitectureFreezeApproved: rawSnapshot.isArchitectureFreezeApproved ?? true,
      hasRootReadme: rawSnapshot.hasRootReadme ?? true,
      unresolvedBlockersCount: rawSnapshot.unresolvedBlockersCount ?? 0,
      intelligence: {
        securityHealthScore: intel.securityHealthScore ?? 100,
        securityCriticalCount: intel.securityCriticalCount ?? 0,
        architectureComplianceScore: intel.architectureComplianceScore ?? 100,
        architectureCriticalCount: intel.architectureCriticalCount ?? 0,
        apiHealthScore: intel.apiHealthScore ?? 100,
        breakingChangeCount: intel.breakingChangeCount ?? 0,
        configHealthScore: intel.configHealthScore ?? 100,
        configMissingCount: intel.configMissingCount ?? 0,
        performanceHealthScore: intel.performanceHealthScore ?? 100,
        hotspotCount: intel.hotspotCount ?? 0,
        codeQualityHealthScore: intel.codeQualityHealthScore ?? 100,
        maintainabilityIndex: intel.maintainabilityIndex ?? 100,
        dependencyHealthScore: intel.dependencyHealthScore ?? 100,
        cycleCount: intel.cycleCount ?? 0,
        documentationHealthScore: intel.documentationHealthScore ?? 100,
        readmeCoverageRate: intel.readmeCoverageRate ?? 1.0,
      },
    };
  }

  public static parseGates(rawGates?: Partial<ReleaseGate>[]): ReleaseGate[] {
    if (!rawGates || rawGates.length === 0) return DEFAULT_RELEASE_GATES;
    return rawGates.map((g) => ({
      gateId: g.gateId ?? 'GATE-UNKNOWN',
      name: g.name ?? 'Unnamed Quality Gate',
      category: g.category ?? 'architecture_freeze',
      isMandatory: g.isMandatory ?? true,
      description: g.description ?? '',
    }));
  }

  public static analyzeAll(
    snapshot: ReleaseSnapshot,
    gates: ReleaseGate[] = DEFAULT_RELEASE_GATES
  ): ReleaseRisk[] {
    return [
      ...ReleaseReadinessAnalyzer.analyzeRequiredArtifacts(snapshot),
      ...ReleaseReadinessAnalyzer.analyzeArchitectureFreeze(snapshot),
      ...ReleaseReadinessAnalyzer.analyzePublicApiReadiness(snapshot),
      ...ReleaseReadinessAnalyzer.analyzeConfigurationReadiness(snapshot),
      ...ReleaseReadinessAnalyzer.analyzeIntelligenceReports(snapshot),
      ...ReleaseReadinessAnalyzer.identifyReleaseBlockers(snapshot),
    ];
  }

  public static analyzeRequiredArtifacts(snapshot: ReleaseSnapshot): ReleaseRisk[] {
    const risks: ReleaseRisk[] = [];

    if (!snapshot.hasRootReadme) {
      risks.push(
        risk(
          'rel_art',
          'documentation_completeness',
          'error',
          'Missing Root README.md',
          'The repository lacks a root README.md document describing project overview and setup.',
          false,
          { targetArtifact: 'README.md', mitigation: 'Create root README.md before tagging release.' }
        )
      );
    }

    return risks;
  }

  public static analyzeArchitectureFreeze(snapshot: ReleaseSnapshot): ReleaseRisk[] {
    const risks: ReleaseRisk[] = [];

    if (!snapshot.hasArchitectureFreezeDoc) {
      risks.push(
        risk(
          'rel_frz',
          'architecture_freeze',
          'critical',
          'Missing Architecture Freeze Document',
          'No Architecture Freeze document was found. Releases require a formal freeze specification.',
          true,
          { gateId: 'GATE-001', mitigation: 'Author and approve the Architecture Freeze specification.' }
        )
      );
    } else if (!snapshot.isArchitectureFreezeApproved) {
      risks.push(
        risk(
          'rel_frz',
          'architecture_freeze',
          'critical',
          'Architecture Freeze Not Approved',
          'The Architecture Freeze document exists but has not reached APPROVED status.',
          true,
          { gateId: 'GATE-001', mitigation: 'Complete approval gates for Architecture Freeze.' }
        )
      );
    }

    return risks;
  }

  public static analyzePublicApiReadiness(snapshot: ReleaseSnapshot): ReleaseRisk[] {
    const risks: ReleaseRisk[] = [];
    const breaking = snapshot.intelligence.breakingChangeCount ?? 0;

    if (breaking > 0) {
      risks.push(
        risk(
          'rel_api',
          'public_api_stability',
          'critical',
          'Unhandled Public API Breaking Changes',
          `${breaking} unhandled breaking API change(s) detected in the Public API surface.`,
          true,
          { gateId: 'NO_PUBLIC_API_BREAKING_CHANGES', mitigation: 'Revert breaking changes or bump major version semver.' }
        )
      );
    }

    return risks;
  }

  public static analyzeConfigurationReadiness(snapshot: ReleaseSnapshot): ReleaseRisk[] {
    const risks: ReleaseRisk[] = [];
    const missing = snapshot.intelligence.configMissingCount ?? 0;

    if (missing > 0) {
      risks.push(
        risk(
          'rel_cfg',
          'configuration_completeness',
          'error',
          'Missing Package Configuration Files',
          `${missing} required configuration file(s) are missing across packages.`,
          true,
          { gateId: 'GATE-003', mitigation: 'Generate missing tsconfig or package.json manifests.' }
        )
      );
    }

    return risks;
  }

  public static analyzeIntelligenceReports(snapshot: ReleaseSnapshot): ReleaseRisk[] {
    const risks: ReleaseRisk[] = [];
    const intel = snapshot.intelligence;

    if ((intel.securityCriticalCount ?? 0) > 0) {
      risks.push(
        risk(
          'rel_sec',
          'security_compliance',
          'critical',
          'Critical Security Vulnerabilities Detected',
          `Security Intelligence reported ${intel.securityCriticalCount} critical security finding(s).`,
          true,
          { gateId: 'GATE-004', mitigation: 'Resolve all critical security findings.' }
        )
      );
    }

    if ((intel.cycleCount ?? 0) > 0) {
      risks.push(
        risk(
          'rel_dep',
          'dependency_health',
          'critical',
          'Circular Dependency Cycles Detected',
          `Dependency Intelligence reported ${intel.cycleCount} circular dependency cycle(s).`,
          true,
          { gateId: 'GATE-005', mitigation: 'Refactor dependency cycles before release.' }
        )
      );
    }

    if ((intel.performanceHealthScore ?? 100) < 80) {
      risks.push(
        risk(
          'rel_perf',
          'performance_standards',
          'warning',
          'Performance Health Score Below Threshold',
          `Performance Intelligence score is ${intel.performanceHealthScore}/100 (threshold: 80).`,
          false,
          { gateId: 'GATE-006', mitigation: 'Address performance hotspots.' }
        )
      );
    }

    return risks;
  }

  public static identifyReleaseBlockers(snapshot: ReleaseSnapshot): ReleaseRisk[] {
    const risks: ReleaseRisk[] = [];

    if (snapshot.unresolvedBlockersCount > 0) {
      risks.push(
        risk(
          'rel_blk',
          'architecture_freeze',
          'critical',
          'Unresolved Manual Release Blocker Issues',
          `${snapshot.unresolvedBlockersCount} manual release blocker issue(s) remain unresolved.`,
          true,
          { mitigation: 'Resolve all release-blocking tickets.' }
        )
      );
    }

    return risks;
  }
}
