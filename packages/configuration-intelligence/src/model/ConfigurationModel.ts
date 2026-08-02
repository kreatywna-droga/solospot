// ---------------------------------------------------------------------------
// ConfigurationSeverity — urgency of a detected configuration problem
// ---------------------------------------------------------------------------
export type ConfigurationSeverity = 'info' | 'warning' | 'error' | 'critical';

// ---------------------------------------------------------------------------
// ConfigurationToolType — the configuration file category
// ---------------------------------------------------------------------------
export type ConfigurationToolType =
  | 'tsconfig'
  | 'package_json'
  | 'eslint'
  | 'prettier'
  | 'vitest'
  | 'bundler'
  | 'postcss'
  | 'other';

// ---------------------------------------------------------------------------
// ConfigurationIssueType — all detectable configuration problems
// ---------------------------------------------------------------------------
export type ConfigurationIssueType =
  // Missing files
  | 'missing_tsconfig'
  | 'missing_package_json'
  | 'missing_eslint_config'
  | 'missing_prettier_config'
  | 'missing_vitest_config'
  // TSConfig issues
  | 'strict_mode_disabled'
  | 'declaration_disabled'
  | 'path_alias_mismatch'
  | 'incompatible_target'
  | 'module_resolution_mismatch'
  // Package.json issues
  | 'missing_main_entry'
  | 'missing_types_entry'
  | 'missing_test_script'
  | 'version_inconsistency'
  // Cross-package issues
  | 'setting_divergence'
  | 'conflicting_configurations'
  | 'dependency_version_conflict'
  // Tool-specific
  | 'eslint_rule_conflict'
  | 'prettier_option_conflict'
  | 'vitest_coverage_missing';

// ---------------------------------------------------------------------------
// ConfigurationArtifact — a parsed snapshot of a single configuration file
// ---------------------------------------------------------------------------
export interface ConfigurationArtifact {
  /** Workspace-relative path to the config file */
  filePath: string;
  /** The package name this config belongs to (empty for root configs) */
  packageName: string;
  toolType: ConfigurationToolType;
  /** Raw key-value settings extracted from the config file */
  settings: Record<string, unknown>;
  /** Whether the file physically exists in the repository */
  exists: boolean;
}

// ---------------------------------------------------------------------------
// ConfigurationFile — lightweight reference to a config file location
// ---------------------------------------------------------------------------
export interface ConfigurationFile {
  filePath: string;
  toolType: ConfigurationToolType;
  packageName: string;
  exists: boolean;
}

// ---------------------------------------------------------------------------
// ConfigurationIssue — a single problem detected during analysis
// ---------------------------------------------------------------------------
export interface ConfigurationIssue {
  /** Unique identifier for this issue instance */
  id: string;
  issueType: ConfigurationIssueType;
  severity: ConfigurationSeverity;
  /** Human-readable description of the problem */
  message: string;
  /** Path of the config file that triggered the issue */
  targetPath?: string;
  /** Package affected (may be multiple for cross-package issues) */
  affectedPackages?: string[];
  /** Key within the config file that is problematic */
  conflictKey?: string;
  /** Guidance on how to remediate the issue */
  recommendation?: string;
}

// ---------------------------------------------------------------------------
// ConfigurationMetric — a quantitative measurement for a configuration aspect
// ---------------------------------------------------------------------------
export interface ConfigurationMetric {
  metricName: string;
  value: number;
  targetValue: number;
  /** Whether the metric meets the target */
  passing: boolean;
  unit?: string;
}

// ---------------------------------------------------------------------------
// ConfigurationAssessment — aggregated summary from the Validator
// ---------------------------------------------------------------------------
export interface ConfigurationAssessment {
  totalIssues: number;
  infoCount: number;
  warningCount: number;
  errorCount: number;
  criticalCount: number;
  /** Issues grouped by issue type for quick lookup */
  byType: Partial<Record<ConfigurationIssueType, ConfigurationIssue[]>>;
  /** Issues grouped by tool type */
  byTool: Partial<Record<ConfigurationToolType, ConfigurationIssue[]>>;
  /** Computed configuration metrics */
  metrics: ConfigurationMetric[];
}

// ---------------------------------------------------------------------------
// ConfigurationReport — full report produced by the Report Generator
// ---------------------------------------------------------------------------
export interface ConfigurationReport {
  /** ISO-8601 timestamp */
  generatedAt: string;
  /** Root path that was analysed */
  rootPath: string;
  /** Score from 0 (broken) to 100 (fully compliant) */
  configurationHealthScore: number;
  /** Letter grade derived from the score */
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  assessment: ConfigurationAssessment;
  /** All issues sorted by severity */
  issues: ConfigurationIssue[];
  /** Summary counts of config files analysed per tool */
  artifactSummary: Record<ConfigurationToolType, number>;
  /** Ordered list of actionable recommendations */
  recommendations: string[];
}
