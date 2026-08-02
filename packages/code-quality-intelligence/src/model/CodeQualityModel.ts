// ---------------------------------------------------------------------------
// CodeQualitySeverity — urgency of a code quality issue
// ---------------------------------------------------------------------------
export type CodeQualitySeverity = 'info' | 'warning' | 'error' | 'critical';

// ---------------------------------------------------------------------------
// CodeQualityCategory — domain of quality analysis
// ---------------------------------------------------------------------------
export type CodeQualityCategory =
  | 'complexity'
  | 'duplication'
  | 'file_length'
  | 'function_length'
  | 'naming_convention'
  | 'dead_code'
  | 'design_convention'
  | 'maintainability';

// ---------------------------------------------------------------------------
// CodeQualityIssueType — specific issue categories
// ---------------------------------------------------------------------------
export type CodeQualityIssueType =
  | 'high_cyclomatic_complexity'
  | 'code_duplication'
  | 'oversized_file'
  | 'long_function'
  | 'naming_inconsistency'
  | 'dead_code_detected'
  | 'excessive_parameters'
  | 'missing_return_type'
  | 'low_maintainability_index';

// ---------------------------------------------------------------------------
// CodeQualityMetric — a quantitative measurement indicator
// ---------------------------------------------------------------------------
export interface CodeQualityMetric {
  metricName: string;
  value: number;
  targetValue: number;
  passing: boolean;
  unit?: string;
}

// ---------------------------------------------------------------------------
// CodeQualityIssue — a single quality problem detected during analysis
// ---------------------------------------------------------------------------
export interface CodeQualityIssue {
  id: string;
  issueType: CodeQualityIssueType;
  category: CodeQualityCategory;
  severity: CodeQualitySeverity;
  message: string;
  /** Workspace-relative file path */
  filePath: string;
  /** Line number if applicable */
  lineNumber?: number;
  /** Symbol / function / block name involved */
  symbolName?: string;
  /** Measured value (e.g. complexity 18, lines 350) */
  measuredValue?: number;
  /** Threshold that was breached */
  threshold?: number;
  recommendation?: string;
}

// ---------------------------------------------------------------------------
// CodeQualityRecommendation — prioritised fix suggestion
// ---------------------------------------------------------------------------
export interface CodeQualityRecommendation {
  priority: number;
  category: CodeQualityCategory;
  title: string;
  description: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// CodeQualityFileSnapshot — static snapshot of a source file for quality scanning
// ---------------------------------------------------------------------------
export interface CodeQualityFileSnapshot {
  filePath: string;
  content: string;
  lineCount: number;
  packageName?: string;
}

// ---------------------------------------------------------------------------
// CodeQualityAssessment — aggregated analysis result produced by the Validator
// ---------------------------------------------------------------------------
export interface CodeQualityAssessment {
  totalIssues: number;
  infoCount: number;
  warningCount: number;
  errorCount: number;
  criticalCount: number;
  /** Issues grouped by category */
  byCategory: Partial<Record<CodeQualityCategory, CodeQualityIssue[]>>;
  /** Issues grouped by issue type */
  byType: Partial<Record<CodeQualityIssueType, CodeQualityIssue[]>>;
  /** Measured quality metrics */
  metrics: CodeQualityMetric[];
  /** Maintainability Index score (0..100) */
  maintainabilityIndex: number;
  /** Ordered recommendations */
  recommendations: CodeQualityRecommendation[];
}

// ---------------------------------------------------------------------------
// CodeQualityReport — full report produced by the Report Generator
// ---------------------------------------------------------------------------
export interface CodeQualityReport {
  generatedAt: string;
  rootPath: string;
  /** Score from 0 (poor code quality) to 100 (excellent quality) */
  codeQualityHealthScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  assessment: CodeQualityAssessment;
  issues: CodeQualityIssue[];
  recommendations: CodeQualityRecommendation[];
  /** Number of source files scanned */
  scannedFileCount: number;
  /** Total lines of code analysed */
  totalLinesOfCode: number;
}
