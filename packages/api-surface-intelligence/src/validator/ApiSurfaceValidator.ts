import type {
  ApiAssessment,
  ApiIssue,
  ApiIssueType,
  ApiSeverity,
  ApiSurface,
} from '../model/ApiSurfaceModel';

// ---------------------------------------------------------------------------
// Organisational policy limits
// ---------------------------------------------------------------------------
const LIMIT_MAX_DEAD_EXPORTS = 0;
const LIMIT_MAX_MISSING_EXPORTS = 0;
const LIMIT_MAX_CONTRACT_VIOLATIONS = 0;
const LIMIT_MAX_BREAKING_CHANGES = 0;

export interface ApiMetric {
  metricName: string;
  value: number;
  targetValue: number;
  passing: boolean;
  unit?: string;
}

// ---------------------------------------------------------------------------
// ApiSurfaceValidator — classification, aggregation, policy compliance
// ---------------------------------------------------------------------------
export class ApiSurfaceValidator {

  // ─── Core Assessment ─────────────────────────────────────────────────────

  /**
   * Aggregate a raw issue list into an ApiAssessment.
   * Read-only — no file modifications, no auto-corrections.
   */
  public static assessIssues(issues: ApiIssue[]): ApiAssessment {
    const byType: Partial<Record<ApiIssueType, ApiIssue[]>> = {};
    const byPackage: Record<string, ApiIssue[]> = {};

    let infoCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let criticalCount = 0;
    let breakingChangeCount = 0;

    for (const iss of issues) {
      // by type
      if (!byType[iss.issueType]) byType[iss.issueType] = [];
      byType[iss.issueType]!.push(iss);

      // by package
      if (!byPackage[iss.packageName]) byPackage[iss.packageName] = [];
      byPackage[iss.packageName].push(iss);

      switch (iss.severity) {
        case 'info':     infoCount++;     break;
        case 'warning':  warningCount++;  break;
        case 'error':    errorCount++;    break;
        case 'critical': criticalCount++; break;
      }

      if (iss.isBreaking) breakingChangeCount++;
    }

    return {
      totalIssues: issues.length,
      infoCount,
      warningCount,
      errorCount,
      criticalCount,
      breakingChangeCount,
      byType,
      byPackage,
    };
  }

  // ─── Limit Validation ────────────────────────────────────────────────────

  /**
   * Verify measured values against established organisational limits.
   */
  public static validateLimits(issues: ApiIssue[], surfaces: ApiSurface[]): ApiMetric[] {
    const deadExports = issues.filter((i) => i.issueType === 'dead_export').length;
    const missingExports = issues.filter((i) => i.issueType === 'missing_export').length;
    const contractViolations = issues.filter((i) => i.issueType === 'contract_violation').length;
    const breakingChanges = issues.filter((i) => i.isBreaking === true).length;

    // Barrel coverage: packages with barrel / total packages
    const withBarrel = surfaces.filter((s) => s.hasBarrel).length;
    const barrelCoverage = surfaces.length > 0 ? withBarrel / surfaces.length : 1;

    return [
      {
        metricName: 'deadExportCount',
        value: deadExports,
        targetValue: LIMIT_MAX_DEAD_EXPORTS,
        passing: deadExports <= LIMIT_MAX_DEAD_EXPORTS,
        unit: 'symbols',
      },
      {
        metricName: 'missingExportCount',
        value: missingExports,
        targetValue: LIMIT_MAX_MISSING_EXPORTS,
        passing: missingExports <= LIMIT_MAX_MISSING_EXPORTS,
        unit: 'symbols',
      },
      {
        metricName: 'contractViolationCount',
        value: contractViolations,
        targetValue: LIMIT_MAX_CONTRACT_VIOLATIONS,
        passing: contractViolations <= LIMIT_MAX_CONTRACT_VIOLATIONS,
        unit: 'violations',
      },
      {
        metricName: 'breakingChangeCount',
        value: breakingChanges,
        targetValue: LIMIT_MAX_BREAKING_CHANGES,
        passing: breakingChanges <= LIMIT_MAX_BREAKING_CHANGES,
        unit: 'changes',
      },
      {
        metricName: 'barrelCoverageRate',
        value: Math.round(barrelCoverage * 100) / 100,
        targetValue: 1.0,
        passing: barrelCoverage >= 1.0,
        unit: 'ratio',
      },
    ];
  }

  // ─── Classification Utilities ─────────────────────────────────────────────

  /** Filter issues to a specific severity. */
  public static filterBySeverity(issues: ApiIssue[], severity: ApiSeverity): ApiIssue[] {
    return issues.filter((i) => i.severity === severity);
  }

  /** Sort issues: critical → error → warning → info. */
  public static sortBySeverity(issues: ApiIssue[]): ApiIssue[] {
    const order: Record<ApiSeverity, number> = {
      critical: 0,
      error:    1,
      warning:  2,
      info:     3,
    };
    return [...issues].sort((a, b) => order[a.severity] - order[b.severity]);
  }

  /** Return only issues that represent breaking API changes. */
  public static filterBreakingChanges(issues: ApiIssue[]): ApiIssue[] {
    return issues.filter((i) => i.isBreaking === true);
  }

  /** Return only issues that represent contract violations. */
  public static filterContractViolations(issues: ApiIssue[]): ApiIssue[] {
    return issues.filter((i) =>
      i.issueType === 'contract_violation' || i.issueType === 'policy_violation'
    );
  }
}
