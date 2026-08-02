import type {
  RepositoryIssue,
  RepositoryIssueType,
  RepositorySeverity,
  RepositoryAssessment,
  RepositoryMetric,
  RepositoryNode,
} from '../model/RepositoryModel';

// ---------------------------------------------------------------------------
// Organisational limits — adjust to match your team's agreed standards
// ---------------------------------------------------------------------------
const LIMIT_MAX_DEPTH = 6;
const LIMIT_MAX_EMPTY_DIRS = 0;
const LIMIT_MAX_DUPLICATE_STRUCTURES = 0;
const LIMIT_MIN_PACKAGE_COMPLIANCE_RATE = 0.9; // 90 %

// ---------------------------------------------------------------------------
// RepositoryValidator — issue classification, limit-checking, aggregation
// ---------------------------------------------------------------------------
export class RepositoryValidator {
  // ─── Core Assessment ─────────────────────────────────────────────────────

  /**
   * Aggregate a list of raw issues into a RepositoryAssessment.
   * Does NOT modify any files — read-only aggregation only.
   */
  public static assessIssues(issues: RepositoryIssue[]): RepositoryAssessment {
    const byType: Partial<Record<RepositoryIssueType, RepositoryIssue[]>> = {};

    let infoCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let criticalCount = 0;

    for (const iss of issues) {
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
      byType,
      metrics: [],
    };
  }

  // ─── Limit Validation ────────────────────────────────────────────────────

  /**
   * Verify that measured values do not exceed established organisational limits.
   * Returns a list of metrics (each carries a `passing` flag).
   */
  public static validateLimits(
    issues: RepositoryIssue[],
    nodes: RepositoryNode[]
  ): RepositoryMetric[] {
    const allDepths = nodes.map((n) => n.depth);
    const maxDepth = allDepths.length > 0 ? Math.max(...allDepths) : 0;

    const emptyDirCount = issues.filter((i) => i.issueType === 'empty_directory').length;
    const duplicateCount = issues.filter((i) => i.issueType === 'duplicate_structure').length;

    const missingPkgCount = issues.filter((i) =>
      ['missing_package_json', 'missing_tsconfig', 'missing_readme', 'missing_src_directory'].includes(i.issueType)
    ).length;

    const packageNodes = RepositoryValidator.countPackages(nodes);
    const expectedConventionChecks = packageNodes * 4; // 3 files + 1 src dir
    const passCount = Math.max(0, expectedConventionChecks - missingPkgCount);
    const complianceRate =
      expectedConventionChecks > 0 ? passCount / expectedConventionChecks : 1;

    return [
      {
        metricName: 'maxDirectoryDepth',
        value: maxDepth,
        targetValue: LIMIT_MAX_DEPTH,
        passing: maxDepth <= LIMIT_MAX_DEPTH,
        unit: 'levels',
      },
      {
        metricName: 'emptyDirectoryCount',
        value: emptyDirCount,
        targetValue: LIMIT_MAX_EMPTY_DIRS,
        passing: emptyDirCount <= LIMIT_MAX_EMPTY_DIRS,
        unit: 'dirs',
      },
      {
        metricName: 'duplicateStructureCount',
        value: duplicateCount,
        targetValue: LIMIT_MAX_DUPLICATE_STRUCTURES,
        passing: duplicateCount <= LIMIT_MAX_DUPLICATE_STRUCTURES,
        unit: 'occurrences',
      },
      {
        metricName: 'packageConventionComplianceRate',
        value: Math.round(complianceRate * 100) / 100,
        targetValue: LIMIT_MIN_PACKAGE_COMPLIANCE_RATE,
        passing: complianceRate >= LIMIT_MIN_PACKAGE_COMPLIANCE_RATE,
        unit: 'ratio',
      },
    ];
  }

  // ─── Classification ───────────────────────────────────────────────────────

  /** Filter issues to a specific severity level. */
  public static filterBySeverity(
    issues: RepositoryIssue[],
    severity: RepositorySeverity
  ): RepositoryIssue[] {
    return issues.filter((i) => i.severity === severity);
  }

  /** Sort issues: critical → error → warning → info. */
  public static sortBySeverity(issues: RepositoryIssue[]): RepositoryIssue[] {
    const order: Record<RepositorySeverity, number> = {
      critical: 0,
      error: 1,
      warning: 2,
      info: 3,
    };
    return [...issues].sort((a, b) => order[a.severity] - order[b.severity]);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private static countPackages(nodes: RepositoryNode[]): number {
    const packagesRoot = nodes.find((n) => n.isDirectory && n.name === 'packages');
    if (!packagesRoot) return 0;
    return packagesRoot.children.filter((c) => c.isDirectory).length;
  }
}
