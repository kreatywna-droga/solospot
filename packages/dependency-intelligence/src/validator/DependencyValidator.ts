import type {
  DependencyAssessment,
  DependencyCategory,
  DependencyIssue,
  DependencyIssueType,
  DependencyMetric,
  DependencyNode,
  DependencyRecommendation,
  DependencySeverity,
} from '../model/DependencyModel';
import { DependencyAnalyzer } from '../analyzer/DependencyAnalyzer';

// ---------------------------------------------------------------------------
// Quantitative limit thresholds for Dependency Standards
// ---------------------------------------------------------------------------
const LIMIT_MAX_CYCLES              = 0;
const LIMIT_MAX_VERSION_MISMATCHES  = 0;
const LIMIT_MAX_DUPLICATE_DECLS     = 0;
const LIMIT_MAX_TRANSITIVE_DEPTH    = 6;

export interface DependencyValidatorMetric extends DependencyMetric {}

// ---------------------------------------------------------------------------
// DependencyValidator — issue classification, limit checking, prioritisation
// ---------------------------------------------------------------------------
export class DependencyValidator {

  // ─── Core Assessment ─────────────────────────────────────────────────────

  /**
   * Aggregate a raw issue list into a DependencyAssessment.
   * Read-only — no package.json modifications.
   */
  public static assessIssues(
    issues: DependencyIssue[],
    nodes: DependencyNode[] = []
  ): DependencyAssessment {
    const byCategory: Partial<Record<DependencyCategory, DependencyIssue[]>> = {};
    const byType: Partial<Record<DependencyIssueType, DependencyIssue[]>> = {};

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

    const maxDepth = DependencyAnalyzer.calculateMaxGraphDepth(nodes);
    const metrics = DependencyValidator.validateLimits(issues, nodes);
    const recommendations = DependencyValidator.prioritiseRecommendations(issues);

    return {
      totalIssues: issues.length,
      infoCount,
      warningCount,
      errorCount,
      criticalCount,
      byCategory,
      byType,
      metrics,
      maxGraphDepth: maxDepth,
      recommendations,
    };
  }

  // ─── Limit Validation ────────────────────────────────────────────────────

  public static validateLimits(
    issues: DependencyIssue[],
    nodes: DependencyNode[] = []
  ): DependencyMetric[] {
    const cycleCount       = issues.filter((i) => i.issueType === 'dependency_cycle').length;
    const mismatchCount    = issues.filter((i) => i.issueType === 'version_mismatch').length;
    const duplicateCount   = issues.filter((i) => i.issueType === 'duplicate_dependency_declaration').length;

    const maxDepth = DependencyAnalyzer.calculateMaxGraphDepth(nodes);

    return [
      {
        metricName: 'dependencyCycleCount',
        value: cycleCount,
        targetValue: LIMIT_MAX_CYCLES,
        passing: cycleCount <= LIMIT_MAX_CYCLES,
        unit: 'cycles',
      },
      {
        metricName: 'versionMismatchCount',
        value: mismatchCount,
        targetValue: LIMIT_MAX_VERSION_MISMATCHES,
        passing: mismatchCount <= LIMIT_MAX_VERSION_MISMATCHES,
        unit: 'mismatches',
      },
      {
        metricName: 'duplicateDeclarationCount',
        value: duplicateCount,
        targetValue: LIMIT_MAX_DUPLICATE_DECLS,
        passing: duplicateCount <= LIMIT_MAX_DUPLICATE_DECLS,
        unit: 'declarations',
      },
      {
        metricName: 'maxTransitiveGraphDepth',
        value: maxDepth,
        targetValue: LIMIT_MAX_TRANSITIVE_DEPTH,
        passing: maxDepth <= LIMIT_MAX_TRANSITIVE_DEPTH,
        unit: 'levels',
      },
    ];
  }

  // ─── Recommendation Prioritisation ───────────────────────────────────────

  public static prioritiseRecommendations(issues: DependencyIssue[]): DependencyRecommendation[] {
    const recs: DependencyRecommendation[] = [];
    let priority = 1;

    const groups: Array<{
      category: DependencyCategory;
      types: DependencyIssueType[];
      title: string;
      description: string;
      impact: DependencyRecommendation['estimatedImpact'];
      effort: DependencyRecommendation['effort'];
    }> = [
      {
        category: 'circular_dependency',
        types: ['dependency_cycle'],
        title: 'Break Dependency Cycles',
        description: 'Circular dependencies prevent clean build ordering and risk runtime initialization errors.',
        impact: 'high',
        effort: 'high',
      },
      {
        category: 'version_inconsistency',
        types: ['version_mismatch'],
        title: 'Align Dependency Versions Across Monorepo',
        description: 'Mismatched 3rd-party versions cause duplicate bundle inclusions and subtle runtime bugs.',
        impact: 'high',
        effort: 'medium',
      },
      {
        category: 'duplicate_dependency',
        types: ['duplicate_dependency_declaration'],
        title: 'Remove Duplicate Dependency Declarations',
        description: 'Dependencies declared in both dependencies and devDependencies waste lockfile resolution time.',
        impact: 'medium',
        effort: 'low',
      },
      {
        category: 'unused_dependency',
        types: ['unused_declared_dependency'],
        title: 'Prune Unused Declared Dependencies',
        description: 'Unused dependencies increase installation overhead and security vulnerability exposure.',
        impact: 'medium',
        effort: 'low',
      },
      {
        category: 'orphaned_package',
        types: ['orphaned_workspace_package'],
        title: 'Review Orphaned Workspace Packages',
        description: 'Workspace packages with zero dependants indicate dead code or unintegrated features.',
        impact: 'low',
        effort: 'medium',
      },
      {
        category: 'graph_complexity',
        types: ['high_graph_complexity', 'excessive_transitive_depth'],
        title: 'Simplify Dependency Graph Topology',
        description: 'Overly complex dependency graphs slow down compilation and incremental build caching.',
        impact: 'medium',
        effort: 'high',
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

  public static sortBySeverity(issues: DependencyIssue[]): DependencyIssue[] {
    const order: Record<DependencySeverity, number> = {
      critical: 0, error: 1, warning: 2, info: 3,
    };
    return [...issues].sort((a, b) => order[a.severity] - order[b.severity]);
  }

  public static filterByCategory(
    issues: DependencyIssue[],
    category: DependencyCategory
  ): DependencyIssue[] {
    return issues.filter((i) => i.category === category);
  }

  public static filterBySeverity(
    issues: DependencyIssue[],
    severity: DependencySeverity
  ): DependencyIssue[] {
    return issues.filter((i) => i.severity === severity);
  }
}
