// ---------------------------------------------------------------------------
// DependencySeverity — urgency of a dependency graph issue
// ---------------------------------------------------------------------------
export type DependencySeverity = 'info' | 'warning' | 'error' | 'critical';

// ---------------------------------------------------------------------------
// DependencyCategory — domain category of dependency analysis
// ---------------------------------------------------------------------------
export type DependencyCategory =
  | 'circular_dependency'
  | 'version_inconsistency'
  | 'unused_dependency'
  | 'orphaned_package'
  | 'duplicate_dependency'
  | 'transitive_depth'
  | 'graph_complexity';

// ---------------------------------------------------------------------------
// DependencyIssueType — specific issue categories
// ---------------------------------------------------------------------------
export type DependencyIssueType =
  | 'dependency_cycle'
  | 'version_mismatch'
  | 'unused_declared_dependency'
  | 'orphaned_workspace_package'
  | 'duplicate_dependency_declaration'
  | 'excessive_transitive_depth'
  | 'high_graph_complexity'
  | 'missing_peer_dependency';

// ---------------------------------------------------------------------------
// DependencyNode — a single node in the dependency graph (package / module)
// ---------------------------------------------------------------------------
export interface DependencyNode {
  /** Name of package / workspace module (e.g. "@web-factor/builder-sdk") */
  id: string;
  version?: string;
  isWorkspacePackage: boolean;
  /** Direct dependencies declared by this node (name -> semver) */
  dependencies: Record<string, string>;
  /** Dev dependencies declared by this node (name -> semver) */
  devDependencies?: Record<string, string>;
  /** Peer dependencies declared by this node */
  peerDependencies?: Record<string, string>;
  /** List of imported package names actually detected in code */
  usedImports?: string[];
}

// ---------------------------------------------------------------------------
// DependencyEdge — a directed edge in the dependency graph
// ---------------------------------------------------------------------------
export interface DependencyEdge {
  /** Source package name */
  source: string;
  /** Target package name */
  target: string;
  /** 'direct' | 'dev' | 'peer' | 'transitive' */
  relationType: 'direct' | 'dev' | 'peer' | 'transitive';
  semverRange?: string;
}

// ---------------------------------------------------------------------------
// DependencyMetric — quantitative graph measurement indicator
// ---------------------------------------------------------------------------
export interface DependencyMetric {
  metricName: string;
  value: number;
  targetValue: number;
  passing: boolean;
  unit?: string;
}

// ---------------------------------------------------------------------------
// DependencyIssue — a single issue detected during graph analysis
// ---------------------------------------------------------------------------
export interface DependencyIssue {
  id: string;
  issueType: DependencyIssueType;
  category: DependencyCategory;
  severity: DependencySeverity;
  message: string;
  /** Primary package or file path affected */
  targetPath: string;
  /** Path of packages forming a cycle, e.g. ["A", "B", "C", "A"] */
  cyclePath?: string[];
  /** Conflicting version string details */
  versionDetails?: string;
  recommendation?: string;
}

// ---------------------------------------------------------------------------
// DependencyRecommendation — prioritised fix suggestion
// ---------------------------------------------------------------------------
export interface DependencyRecommendation {
  priority: number;
  category: DependencyCategory;
  title: string;
  description: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// DependencyAssessment — aggregated result produced by the Validator
// ---------------------------------------------------------------------------
export interface DependencyAssessment {
  totalIssues: number;
  infoCount: number;
  warningCount: number;
  errorCount: number;
  criticalCount: number;
  /** Issues grouped by category */
  byCategory: Partial<Record<DependencyCategory, DependencyIssue[]>>;
  /** Issues grouped by issue type */
  byType: Partial<Record<DependencyIssueType, DependencyIssue[]>>;
  /** Measured metrics */
  metrics: DependencyMetric[];
  /** Maximum dependency depth measured across the graph */
  maxGraphDepth: number;
  /** Ordered recommendations */
  recommendations: DependencyRecommendation[];
}

// ---------------------------------------------------------------------------
// DependencyReport — full report produced by the Report Generator
// ---------------------------------------------------------------------------
export interface DependencyReport {
  generatedAt: string;
  rootPath: string;
  /** Score from 0 (severely broken graph) to 100 (healthy graph) */
  dependencyHealthScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  assessment: DependencyAssessment;
  issues: DependencyIssue[];
  recommendations: DependencyRecommendation[];
  /** Number of workspace nodes in graph */
  totalNodeCount: number;
  /** Number of edges in graph */
  totalEdgeCount: number;
}
