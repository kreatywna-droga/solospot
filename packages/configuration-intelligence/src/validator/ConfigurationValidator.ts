import type {
  ConfigurationArtifact,
  ConfigurationAssessment,
  ConfigurationIssue,
  ConfigurationIssueType,
  ConfigurationMetric,
  ConfigurationSeverity,
  ConfigurationToolType,
} from '../model/ConfigurationModel';

// ---------------------------------------------------------------------------
// Organisational compliance limits
// ---------------------------------------------------------------------------
const LIMIT_MAX_DIVERGENCE_ISSUES = 0;
const LIMIT_MAX_MISSING_CONFIGS = 0;
const LIMIT_MAX_ALIAS_MISMATCHES = 0;
const LIMIT_MIN_TSCONFIG_COMPLIANCE = 1.0; // 100 % of tsconfigs must be compliant

// ---------------------------------------------------------------------------
// ConfigurationValidator — classification, conflict detection, aggregation
// ---------------------------------------------------------------------------
export class ConfigurationValidator {

  // ─── Core Assessment ─────────────────────────────────────────────────────

  /**
   * Aggregate a raw issue list into a ConfigurationAssessment.
   * Read-only — no file modifications.
   */
  public static assessIssues(issues: ConfigurationIssue[]): ConfigurationAssessment {
    const byType: Partial<Record<ConfigurationIssueType, ConfigurationIssue[]>> = {};
    const byTool: Partial<Record<ConfigurationToolType, ConfigurationIssue[]>> = {};

    let infoCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let criticalCount = 0;

    for (const iss of issues) {
      // by type
      if (!byType[iss.issueType]) byType[iss.issueType] = [];
      byType[iss.issueType]!.push(iss);

      // by tool — derive from issueType prefix
      const tool = ConfigurationValidator.toolTypeFromIssue(iss);
      if (!byTool[tool]) byTool[tool] = [];
      byTool[tool]!.push(iss);

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
      byTool,
      metrics: [],
    };
  }

  // ─── Limit Validation ────────────────────────────────────────────────────

  /**
   * Check measured values against established organisational limits.
   * Returns a RepositoryMetric list — each entry carries a `passing` flag.
   */
  public static validateLimits(
    issues: ConfigurationIssue[],
    artifacts: ConfigurationArtifact[]
  ): ConfigurationMetric[] {
    const divergenceCount = issues.filter((i) => i.issueType === 'setting_divergence').length;
    const missingCount = issues.filter((i) =>
      ['missing_tsconfig', 'missing_package_json', 'missing_eslint_config',
       'missing_prettier_config', 'missing_vitest_config'].includes(i.issueType)
    ).length;
    const aliasMismatchCount = issues.filter((i) => i.issueType === 'path_alias_mismatch').length;

    // TSConfig compliance rate
    const tsconfigs = artifacts.filter((a) => a.toolType === 'tsconfig' && a.exists);
    const tsIssues = issues.filter((i) =>
      ['strict_mode_disabled', 'declaration_disabled', 'incompatible_target',
       'module_resolution_mismatch'].includes(i.issueType)
    );
    const affectedTsconfigs = new Set(tsIssues.map((i) => i.targetPath));
    const compliantCount = tsconfigs.filter((a) => !affectedTsconfigs.has(a.filePath)).length;
    const tscomplianceRate = tsconfigs.length > 0 ? compliantCount / tsconfigs.length : 1;

    return [
      {
        metricName: 'settingDivergenceCount',
        value: divergenceCount,
        targetValue: LIMIT_MAX_DIVERGENCE_ISSUES,
        passing: divergenceCount <= LIMIT_MAX_DIVERGENCE_ISSUES,
        unit: 'issues',
      },
      {
        metricName: 'missingConfigCount',
        value: missingCount,
        targetValue: LIMIT_MAX_MISSING_CONFIGS,
        passing: missingCount <= LIMIT_MAX_MISSING_CONFIGS,
        unit: 'files',
      },
      {
        metricName: 'pathAliasMismatchCount',
        value: aliasMismatchCount,
        targetValue: LIMIT_MAX_ALIAS_MISMATCHES,
        passing: aliasMismatchCount <= LIMIT_MAX_ALIAS_MISMATCHES,
        unit: 'aliases',
      },
      {
        metricName: 'tsconfigComplianceRate',
        value: Math.round(tscomplianceRate * 100) / 100,
        targetValue: LIMIT_MIN_TSCONFIG_COMPLIANCE,
        passing: tscomplianceRate >= LIMIT_MIN_TSCONFIG_COMPLIANCE,
        unit: 'ratio',
      },
    ];
  }

  // ─── Conflict Detection ───────────────────────────────────────────────────

  /**
   * Identify issues that represent direct configuration conflicts
   * (two or more configs disagree on the same key).
   */
  public static filterConflicts(issues: ConfigurationIssue[]): ConfigurationIssue[] {
    const conflictTypes = new Set<ConfigurationIssueType>([
      'conflicting_configurations',
      'eslint_rule_conflict',
      'prettier_option_conflict',
      'path_alias_mismatch',
      'setting_divergence',
    ]);
    return issues.filter((i) => conflictTypes.has(i.issueType));
  }

  // ─── Classification Utilities ─────────────────────────────────────────────

  /** Filter issues to a specific severity level. */
  public static filterBySeverity(
    issues: ConfigurationIssue[],
    severity: ConfigurationSeverity
  ): ConfigurationIssue[] {
    return issues.filter((i) => i.severity === severity);
  }

  /** Sort issues: critical → error → warning → info. */
  public static sortBySeverity(issues: ConfigurationIssue[]): ConfigurationIssue[] {
    const order: Record<ConfigurationSeverity, number> = {
      critical: 0,
      error:    1,
      warning:  2,
      info:     3,
    };
    return [...issues].sort((a, b) => order[a.severity] - order[b.severity]);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private static toolTypeFromIssue(iss: ConfigurationIssue): ConfigurationToolType {
    if (['strict_mode_disabled', 'declaration_disabled', 'path_alias_mismatch',
         'incompatible_target', 'module_resolution_mismatch', 'missing_tsconfig'].includes(iss.issueType)) {
      return 'tsconfig';
    }
    if (['missing_main_entry', 'missing_types_entry', 'missing_test_script',
         'version_inconsistency', 'missing_package_json', 'dependency_version_conflict'].includes(iss.issueType)) {
      return 'package_json';
    }
    if (['eslint_rule_conflict', 'missing_eslint_config'].includes(iss.issueType)) {
      return 'eslint';
    }
    if (['prettier_option_conflict', 'missing_prettier_config'].includes(iss.issueType)) {
      return 'prettier';
    }
    if (['vitest_coverage_missing', 'missing_vitest_config'].includes(iss.issueType)) {
      return 'vitest';
    }
    return 'other';
  }
}
