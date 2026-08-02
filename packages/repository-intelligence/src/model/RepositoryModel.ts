// ---------------------------------------------------------------------------
// RepositorySeverity — issue urgency levels
// ---------------------------------------------------------------------------
export type RepositorySeverity = 'info' | 'warning' | 'error' | 'critical';

// ---------------------------------------------------------------------------
// RepositoryIssueType — enumeration of all detectable structural problems
// ---------------------------------------------------------------------------
export type RepositoryIssueType =
  | 'empty_directory'
  | 'excessive_depth'
  | 'duplicate_structure'
  | 'missing_package_json'
  | 'missing_tsconfig'
  | 'missing_readme'
  | 'missing_src_directory'
  | 'missing_index'
  | 'inconsistent_naming'
  | 'unexpected_root_file'
  | 'orphaned_directory'
  | 'package_outside_packages_dir';

// ---------------------------------------------------------------------------
// RepositoryNode — a single node in the directory tree
// ---------------------------------------------------------------------------
export interface RepositoryNode {
  /** Absolute or workspace-relative path */
  path: string;
  /** Basename of the directory/file */
  name: string;
  /** true for directories, false for files */
  isDirectory: boolean;
  /** Nesting level from the analysis root (root = 0) */
  depth: number;
  /** Child nodes (populated only for directories) */
  children: RepositoryNode[];
  /** File size in bytes (only meaningful for files) */
  sizeBytes?: number;
}

// ---------------------------------------------------------------------------
// RepositoryStructure — aggregate view of the directory tree
// ---------------------------------------------------------------------------
export interface RepositoryStructure {
  /** Root path that was analysed */
  rootPath: string;
  /** Flat list of all nodes in the tree */
  allNodes: RepositoryNode[];
  /** Only directory nodes */
  directories: RepositoryNode[];
  /** Only file nodes */
  files: RepositoryNode[];
  /** Maximum nesting depth encountered */
  maxDepth: number;
  /** Total number of packages found under the packages/ directory */
  packageCount: number;
}

// ---------------------------------------------------------------------------
// RepositoryIssue — a single structural problem found during analysis
// ---------------------------------------------------------------------------
export interface RepositoryIssue {
  /** Unique identifier for this issue instance */
  id: string;
  issueType: RepositoryIssueType;
  severity: RepositorySeverity;
  /** Human-readable description of the problem */
  message: string;
  /** Path of the directory or file that triggered the issue */
  targetPath?: string;
  /** Optional guidance on how to remediate the issue */
  recommendation?: string;
}

// ---------------------------------------------------------------------------
// RepositoryMetric — a quantitative measurement about the repository
// ---------------------------------------------------------------------------
export interface RepositoryMetric {
  metricName: string;
  value: number;
  /** Acceptable upper or lower bound */
  targetValue: number;
  /** Whether the value meets the target */
  passing: boolean;
  unit?: string;
}

// ---------------------------------------------------------------------------
// RepositoryAssessment — aggregated summary produced by the Validator
// ---------------------------------------------------------------------------
export interface RepositoryAssessment {
  totalIssues: number;
  infoCount: number;
  warningCount: number;
  errorCount: number;
  criticalCount: number;
  /** Issues grouped by type for quick lookup */
  byType: Partial<Record<RepositoryIssueType, RepositoryIssue[]>>;
  /** Computed metrics */
  metrics: RepositoryMetric[];
}

// ---------------------------------------------------------------------------
// RepositoryReport — full report produced by the Report Generator
// ---------------------------------------------------------------------------
export interface RepositoryReport {
  /** ISO-8601 timestamp of when the report was generated */
  generatedAt: string;
  /** Path that was analysed */
  rootPath: string;
  /** Score from 0 (critical) to 100 (perfect) */
  repositoryHealthScore: number;
  /** Letter grade derived from the score */
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  assessment: RepositoryAssessment;
  /** All detected issues, sorted by severity */
  issues: RepositoryIssue[];
  /** Structure snapshot */
  structure: Pick<RepositoryStructure, 'rootPath' | 'maxDepth' | 'packageCount'>;
  /** Ordered list of actionable recommendations */
  recommendations: string[];
}
