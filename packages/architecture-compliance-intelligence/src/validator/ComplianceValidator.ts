import type {
  ArchitectureRule,
  ArchitectureViolation,
  ComplianceAssessment,
  ComplianceMetric,
  ComplianceRecommendation,
  ComplianceSeverity,
  ModuleDescriptor,
  ViolationType,
} from '../model/ComplianceModel';

// ---------------------------------------------------------------------------
// Organisational compliance policy limits
// ---------------------------------------------------------------------------
const LIMIT_MAX_CRITICAL_VIOLATIONS = 0;
const LIMIT_MAX_LAYER_VIOLATIONS    = 0;
const LIMIT_MAX_ADR_VIOLATIONS      = 0;
const LIMIT_MAX_BOUNDARY_BREACHES   = 0;

// ---------------------------------------------------------------------------
// ComplianceValidator — threshold checking, classification, prioritisation
// ---------------------------------------------------------------------------
export class ComplianceValidator {

  // ─── Core Assessment ─────────────────────────────────────────────────────

  /**
   * Aggregate a raw violation list into a ComplianceAssessment.
   * Read-only — no code modifications, no automatic fixes.
   */
  public static assessViolations(violations: ArchitectureViolation[]): ComplianceAssessment {
    const byType: Partial<Record<ViolationType, ArchitectureViolation[]>> = {};
    const byRule: Record<string, ArchitectureViolation[]> = {};

    let infoCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let criticalCount = 0;

    for (const v of violations) {
      if (!byType[v.violationType]) byType[v.violationType] = [];
      byType[v.violationType]!.push(v);

      if (!byRule[v.ruleId]) byRule[v.ruleId] = [];
      byRule[v.ruleId].push(v);

      switch (v.severity) {
        case 'info':     infoCount++;     break;
        case 'warning':  warningCount++;  break;
        case 'error':    errorCount++;    break;
        case 'critical': criticalCount++; break;
      }
    }

    return {
      totalViolations: violations.length,
      infoCount,
      warningCount,
      errorCount,
      criticalCount,
      byType,
      byRule,
      metrics: [],
      recommendations: [],
    };
  }

  // ─── Limit Validation ────────────────────────────────────────────────────

  /**
   * Check measured violation counts against organisational architecture limits.
   */
  public static validateLimits(
    violations: ArchitectureViolation[],
    modules: ModuleDescriptor[],
    rules: ArchitectureRule[]
  ): ComplianceMetric[] {
    const criticalCount = violations.filter((v) => v.severity === 'critical').length;
    const layerViolationCount = violations.filter((v) => v.violationType === 'layer_violation').length;
    const adrViolationCount = violations.filter((v) => v.violationType === 'adr_violation').length;
    const boundaryBreachCount = violations.filter((v) => v.violationType === 'module_boundary_breach').length;

    // Rule pass rate
    const violatedRuleIds = new Set(violations.map((v) => v.ruleId));
    const passingRules = rules.filter((r) => !violatedRuleIds.has(r.ruleId)).length;
    const rulePassRate = rules.length > 0 ? passingRules / rules.length : 1;

    // Module compliance rate (modules with zero violations)
    const affectedModules = new Set(violations.map((v) => v.sourceModule));
    const compliantModules = modules.filter((m) => !affectedModules.has(m.modulePath)).length;
    const moduleComplianceRate = modules.length > 0 ? compliantModules / modules.length : 1;

    return [
      {
        metricName: 'criticalViolationCount',
        value: criticalCount,
        targetValue: LIMIT_MAX_CRITICAL_VIOLATIONS,
        passing: criticalCount <= LIMIT_MAX_CRITICAL_VIOLATIONS,
        unit: 'violations',
      },
      {
        metricName: 'layerViolationCount',
        value: layerViolationCount,
        targetValue: LIMIT_MAX_LAYER_VIOLATIONS,
        passing: layerViolationCount <= LIMIT_MAX_LAYER_VIOLATIONS,
        unit: 'violations',
      },
      {
        metricName: 'adrViolationCount',
        value: adrViolationCount,
        targetValue: LIMIT_MAX_ADR_VIOLATIONS,
        passing: adrViolationCount <= LIMIT_MAX_ADR_VIOLATIONS,
        unit: 'violations',
      },
      {
        metricName: 'moduleBoundaryBreachCount',
        value: boundaryBreachCount,
        targetValue: LIMIT_MAX_BOUNDARY_BREACHES,
        passing: boundaryBreachCount <= LIMIT_MAX_BOUNDARY_BREACHES,
        unit: 'breaches',
      },
      {
        metricName: 'rulePassRate',
        value: Math.round(rulePassRate * 100) / 100,
        targetValue: 1.0,
        passing: rulePassRate >= 1.0,
        unit: 'ratio',
      },
      {
        metricName: 'moduleComplianceRate',
        value: Math.round(moduleComplianceRate * 100) / 100,
        targetValue: 1.0,
        passing: moduleComplianceRate >= 1.0,
        unit: 'ratio',
      },
    ];
  }

  // ─── Recommendation Prioritisation ───────────────────────────────────────

  /**
   * Derive a prioritised list of ComplianceRecommendation objects.
   */
  public static prioritiseRecommendations(
    violations: ArchitectureViolation[]
  ): ComplianceRecommendation[] {
    const recs: ComplianceRecommendation[] = [];
    let priority = 1;

    const groups: Array<{
      types: ViolationType[];
      title: string;
      description: string;
      impact: ComplianceRecommendation['estimatedImpact'];
      effort: ComplianceRecommendation['effort'];
    }> = [
      {
        types: ['direct_infrastructure_access'],
        title: 'Eliminate Direct Infrastructure Access',
        description: 'Non-infrastructure modules must not import infrastructure adapters directly — use domain ports and dependency inversion.',
        impact: 'high',
        effort: 'medium',
      },
      {
        types: ['layer_violation'],
        title: 'Resolve Layer Dependency Violations',
        description: 'Dependencies that cross forbidden architectural layer boundaries break the layered architecture invariant.',
        impact: 'high',
        effort: 'medium',
      },
      {
        types: ['adr_violation'],
        title: 'Restore ADR Compliance',
        description: 'Architecture Decision Records encode deliberate structural constraints — violations indicate the implementation has diverged from the agreed design.',
        impact: 'high',
        effort: 'high',
      },
      {
        types: ['forbidden_dependency'],
        title: 'Remove Forbidden Dependencies',
        description: 'Explicitly forbidden import edges must be removed or re-routed through the correct abstraction layer.',
        impact: 'high',
        effort: 'medium',
      },
      {
        types: ['separation_of_concerns'],
        title: 'Separate Mixed-Concern Modules',
        description: 'Modules that simultaneously coordinate UI and infrastructure are fragile and difficult to test in isolation.',
        impact: 'medium',
        effort: 'high',
      },
      {
        types: ['module_boundary_breach'],
        title: 'Enforce Module Boundary Contracts',
        description: 'Imports from internal paths bypass the public API contract of the target package.',
        impact: 'medium',
        effort: 'low',
      },
      {
        types: ['circular_layer_dependency'],
        title: 'Break Circular Layer Dependencies',
        description: 'Circular dependencies between architectural layers prevent a clean dependency hierarchy.',
        impact: 'high',
        effort: 'high',
      },
    ];

    for (const group of groups) {
      const matches = violations.filter((v) => group.types.includes(v.violationType));
      if (matches.length > 0) {
        recs.push({
          priority: priority++,
          violationType: group.types[0],
          title: group.title,
          description: `${group.description} (${matches.length} instance${matches.length > 1 ? 's' : ''} detected)`,
          estimatedImpact: group.impact,
          effort: group.effort,
        });
      }
    }

    return recs;
  }

  // ─── Classification Utilities ─────────────────────────────────────────────

  /** Sort violations: critical → error → warning → info. */
  public static sortBySeverity(violations: ArchitectureViolation[]): ArchitectureViolation[] {
    const order: Record<ComplianceSeverity, number> = {
      critical: 0, error: 1, warning: 2, info: 3,
    };
    return [...violations].sort((a, b) => order[a.severity] - order[b.severity]);
  }

  /** Filter to violations of a specific type. */
  public static filterByType(
    violations: ArchitectureViolation[],
    type: ViolationType
  ): ArchitectureViolation[] {
    return violations.filter((v) => v.violationType === type);
  }

  /** Filter to violations referencing a specific rule ID. */
  public static filterByRule(
    violations: ArchitectureViolation[],
    ruleId: string
  ): ArchitectureViolation[] {
    return violations.filter((v) => v.ruleId === ruleId);
  }

  /** Filter violations with a specific ADR reference. */
  public static filterByAdr(
    violations: ArchitectureViolation[],
    adrId: string
  ): ArchitectureViolation[] {
    return violations.filter((v) => v.adrId === adrId);
  }
}
