import type {
  PerformanceAssessment,
  PerformanceCategory,
  PerformanceIssue,
  PerformanceIssueType,
  PerformanceMetric,
  PerformanceModuleSnapshot,
  PerformanceRecommendation,
  PerformanceSeverity,
} from '../model/PerformanceModel';

// ---------------------------------------------------------------------------
// Organisational performance thresholds
// ---------------------------------------------------------------------------
const LIMIT_MAX_HOTSPOTS            = 0;
const LIMIT_MAX_OVERSIZED_MODULES   = 0;
const LIMIT_MAX_DEEP_CHAINS         = 0;
const LIMIT_MAX_HEAVY_DEPS          = 3;
const LIMIT_MAX_BARREL_BLOAT        = 0;

// ---------------------------------------------------------------------------
// PerformanceValidator — threshold checking, classification, prioritisation
// ---------------------------------------------------------------------------
export class PerformanceValidator {

  // ─── Core Assessment ─────────────────────────────────────────────────────

  /**
   * Aggregate a raw issue list into a PerformanceAssessment.
   * Read-only — no code modifications, no automatic optimisations.
   */
  public static assessIssues(issues: PerformanceIssue[]): PerformanceAssessment {
    const byCategory: Partial<Record<PerformanceCategory, PerformanceIssue[]>> = {};
    const byType: Partial<Record<PerformanceIssueType, PerformanceIssue[]>> = {};

    let infoCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let criticalCount = 0;

    for (const iss of issues) {
      if (!byCategory[iss.category]) byCategory[iss.category] = [];
      byCategory[iss.category]!.push(iss);

      if (!byType[iss.issueType]) byType[iss.issueType] = [];
      byType[iss.issueType]!.push(iss);

      switch (iss.severity) {
        case 'info':     infoCount++;     break;
        case 'warning':  warningCount++;  break;
        case 'error':    errorCount++;    break;
        case 'critical': criticalCount++; break;
      }
    }

    return {
      totalIssues: issues.length,
      infoCount,
      warningCount,
      errorCount,
      criticalCount,
      byCategory,
      byType,
      metrics: [],
      recommendations: [],
    };
  }

  // ─── Limit Validation ────────────────────────────────────────────────────

  /**
   * Check measured counts against organisational performance thresholds.
   */
  public static validateLimits(
    issues: PerformanceIssue[],
    modules: PerformanceModuleSnapshot[]
  ): PerformanceMetric[] {
    const hotspotCount = issues.filter((i) => i.issueType === 'architectural_hotspot').length;
    const oversizedCount = issues.filter((i) => i.issueType === 'oversized_module').length;
    const deepChainCount = issues.filter((i) => i.issueType === 'deep_import_chain').length;
    const heavyDepCount = issues.filter((i) => i.issueType === 'heavy_dependency').length;
    const barrelBloatCount = issues.filter((i) => i.issueType === 'barrel_bloat').length;

    const avgDepth = modules.length > 0
      ? modules.reduce((s, m) => s + m.importDepth, 0) / modules.length
      : 0;

    return [
      {
        metricName: 'architecturalHotspotCount',
        value: hotspotCount,
        targetValue: LIMIT_MAX_HOTSPOTS,
        passing: hotspotCount <= LIMIT_MAX_HOTSPOTS,
        unit: 'modules',
      },
      {
        metricName: 'oversizedModuleCount',
        value: oversizedCount,
        targetValue: LIMIT_MAX_OVERSIZED_MODULES,
        passing: oversizedCount <= LIMIT_MAX_OVERSIZED_MODULES,
        unit: 'modules',
      },
      {
        metricName: 'deepImportChainCount',
        value: deepChainCount,
        targetValue: LIMIT_MAX_DEEP_CHAINS,
        passing: deepChainCount <= LIMIT_MAX_DEEP_CHAINS,
        unit: 'modules',
      },
      {
        metricName: 'heavyDependencyCount',
        value: heavyDepCount,
        targetValue: LIMIT_MAX_HEAVY_DEPS,
        passing: heavyDepCount <= LIMIT_MAX_HEAVY_DEPS,
        unit: 'dependencies',
      },
      {
        metricName: 'barrelBloatCount',
        value: barrelBloatCount,
        targetValue: LIMIT_MAX_BARREL_BLOAT,
        passing: barrelBloatCount <= LIMIT_MAX_BARREL_BLOAT,
        unit: 'barrels',
      },
      {
        metricName: 'averageImportDepth',
        value: Math.round(avgDepth * 10) / 10,
        targetValue: 5,
        passing: avgDepth <= 5,
        unit: 'levels',
      },
    ];
  }

  // ─── Recommendation Prioritisation ───────────────────────────────────────

  /**
   * Derive a prioritised list of PerformanceRecommendation objects from the
   * issue list. Higher-severity, higher-impact issues rank first.
   */
  public static prioritiseRecommendations(issues: PerformanceIssue[]): PerformanceRecommendation[] {
    const recs: PerformanceRecommendation[] = [];
    let priority = 1;

    const groups: Array<{
      types: PerformanceIssueType[];
      category: PerformanceCategory;
      title: string;
      description: string;
      impact: PerformanceRecommendation['estimatedImpact'];
      effort: PerformanceRecommendation['effort'];
    }> = [
      {
        types: ['architectural_hotspot'],
        category: 'hotspot',
        title: 'Eliminate Architectural Hotspots',
        description: 'Modules with high fan-in + fan-out are structural bottlenecks that increase build time and maintenance cost.',
        impact: 'high',
        effort: 'high',
      },
      {
        types: ['oversized_module'],
        category: 'bundle_size',
        title: 'Split Oversized Modules',
        description: 'Modules exceeding the size threshold inflate the bundle and slow TypeScript type-checking.',
        impact: 'high',
        effort: 'medium',
      },
      {
        types: ['deep_import_chain', 'transitive_depth_exceeded'],
        category: 'import_depth',
        title: 'Flatten Deep Import Chains',
        description: 'Deep import hierarchies increase build graph resolution time and make circular dependency risks more likely.',
        impact: 'medium',
        effort: 'medium',
      },
      {
        types: ['heavy_dependency'],
        category: 'dependency_cost',
        title: 'Replace or Lazy-Load Heavy Dependencies',
        description: 'Known heavy packages significantly increase bundle payload. Consider tree-shaking, dynamic import or lighter alternatives.',
        impact: 'high',
        effort: 'medium',
      },
      {
        types: ['barrel_bloat'],
        category: 're_export_overhead',
        title: 'Reduce Barrel Export Count',
        description: 'Oversized barrels force consumers to load all symbols and slow down TypeScript compilation.',
        impact: 'medium',
        effort: 'low',
      },
      {
        types: ['high_fan_in'],
        category: 'hotspot',
        title: 'Reduce High Fan-In Coupling',
        description: 'Modules with excessive dependents are fragile — changes ripple widely across the codebase.',
        impact: 'medium',
        effort: 'high',
      },
      {
        types: ['high_fan_out'],
        category: 'hotspot',
        title: 'Reduce High Fan-Out Dependencies',
        description: 'Modules with excessive imports are hard to test and may pull in unnecessary code.',
        impact: 'medium',
        effort: 'medium',
      },
      {
        types: ['high_module_complexity'],
        category: 'module_complexity',
        title: 'Lower Structural Complexity',
        description: 'High complexity score (fanOut × depth) increases build graph cost and test isolation difficulty.',
        impact: 'medium',
        effort: 'medium',
      },
      {
        types: ['split_candidate'],
        category: 'split_opportunity',
        title: 'Extract Split-Candidate Modules',
        description: 'Modules with many exports and many imports are candidates for being decomposed into focused sub-packages.',
        impact: 'low',
        effort: 'high',
      },
      {
        types: ['excessive_re_exports'],
        category: 're_export_overhead',
        title: 'Reduce Re-Export Aggregation',
        description: 'Heavy re-export files slow down the TypeScript compiler when resolving module graphs.',
        impact: 'low',
        effort: 'low',
      },
    ];

    for (const group of groups) {
      const matches = issues.filter((i) => group.types.includes(i.issueType));
      if (matches.length > 0) {
        recs.push({
          priority: priority++,
          category: group.category,
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

  /** Filter by severity level. */
  public static filterBySeverity(issues: PerformanceIssue[], severity: PerformanceSeverity): PerformanceIssue[] {
    return issues.filter((i) => i.severity === severity);
  }

  /** Sort issues: critical → error → warning → info. */
  public static sortBySeverity(issues: PerformanceIssue[]): PerformanceIssue[] {
    const order: Record<PerformanceSeverity, number> = {
      critical: 0, error: 1, warning: 2, info: 3,
    };
    return [...issues].sort((a, b) => order[a.severity] - order[b.severity]);
  }

  /** Filter to hotspot-related issues only. */
  public static filterHotspots(issues: PerformanceIssue[]): PerformanceIssue[] {
    return issues.filter((i) => i.category === 'hotspot');
  }
}
