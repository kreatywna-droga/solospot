// ---------------------------------------------------------------------------
// PerformanceSeverity — urgency of a detected performance risk
// ---------------------------------------------------------------------------
export type PerformanceSeverity = 'info' | 'warning' | 'error' | 'critical';

// ---------------------------------------------------------------------------
// PerformanceCategory — domain of the performance concern
// ---------------------------------------------------------------------------
export type PerformanceCategory =
  | 'bundle_size'
  | 'import_depth'
  | 'dependency_cost'
  | 'module_complexity'
  | 'hotspot'
  | 'split_opportunity'
  | 'circular_risk'
  | 're_export_overhead';

// ---------------------------------------------------------------------------
// PerformanceIssueType — all detectable performance risk types
// ---------------------------------------------------------------------------
export type PerformanceIssueType =
  // Bundle / size
  | 'oversized_module'
  | 'heavy_dependency'
  | 'excessive_re_exports'
  // Import depth
  | 'deep_import_chain'
  | 'transitive_depth_exceeded'
  // Hotspots
  | 'high_fan_in'
  | 'high_fan_out'
  | 'architectural_hotspot'
  // Complexity
  | 'high_module_complexity'
  | 'split_candidate'
  // Risk
  | 'circular_dependency_risk'
  | 'barrel_bloat';

// ---------------------------------------------------------------------------
// PerformanceMetric — a single measured indicator
// ---------------------------------------------------------------------------
export interface PerformanceMetric {
  metricName: string;
  value: number;
  targetValue: number;
  passing: boolean;
  unit?: string;
}

// ---------------------------------------------------------------------------
// PerformanceIssue — a single detected performance risk
// ---------------------------------------------------------------------------
export interface PerformanceIssue {
  id: string;
  issueType: PerformanceIssueType;
  category: PerformanceCategory;
  severity: PerformanceSeverity;
  message: string;
  /** The module / package affected */
  targetPath: string;
  /** Quantitative evidence (e.g. measured depth, export count, size estimate) */
  measuredValue?: number;
  /** The threshold that was exceeded */
  threshold?: number;
  recommendation?: string;
}

// ---------------------------------------------------------------------------
// PerformanceRecommendation — a prioritised fix suggestion
// ---------------------------------------------------------------------------
export interface PerformanceRecommendation {
  /** Priority 1 = highest urgency */
  priority: number;
  category: PerformanceCategory;
  title: string;
  description: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// PerformanceModuleSnapshot — lightweight data snapshot of one module/package
// ---------------------------------------------------------------------------
export interface PerformanceModuleSnapshot {
  /** Workspace-relative path or package name */
  modulePath: string;
  /** Number of direct imports this module declares */
  importCount: number;
  /** Number of modules that import this module (fan-in) */
  fanIn: number;
  /** Number of modules this module imports (fan-out) */
  fanOut: number;
  /** Maximum depth of the import chain reaching this module */
  importDepth: number;
  /** Number of symbols re-exported from the barrel */
  exportCount: number;
  /** Estimated size in KB (from file system snapshot, not build output) */
  estimatedSizeKb: number;
  /** List of direct dependencies (names) */
  dependencies: string[];
  /** Known-heavy third-party packages in direct dependencies */
  heavyDependencies: string[];
}

// ---------------------------------------------------------------------------
// PerformanceAssessment — aggregated result from the Validator
// ---------------------------------------------------------------------------
export interface PerformanceAssessment {
  totalIssues: number;
  infoCount: number;
  warningCount: number;
  errorCount: number;
  criticalCount: number;
  /** Issues grouped by category */
  byCategory: Partial<Record<PerformanceCategory, PerformanceIssue[]>>;
  /** Issues grouped by issue type */
  byType: Partial<Record<PerformanceIssueType, PerformanceIssue[]>>;
  /** Computed performance metrics */
  metrics: PerformanceMetric[];
  /** Ordered recommendations produced by prioritisation */
  recommendations: PerformanceRecommendation[];
}

// ---------------------------------------------------------------------------
// PerformanceReport — full report produced by the Report Generator
// ---------------------------------------------------------------------------
export interface PerformanceReport {
  generatedAt: string;
  rootPath: string;
  /** Score from 0 (severe risk) to 100 (excellent) */
  performanceHealthScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  assessment: PerformanceAssessment;
  issues: PerformanceIssue[];
  /** Ordered recommendations from Validator */
  recommendations: PerformanceRecommendation[];
  /** Count of modules analysed */
  moduleCount: number;
}
