// ---------------------------------------------------------------------------
// ApiSeverity — issue urgency levels
// ---------------------------------------------------------------------------
export type ApiSeverity = 'info' | 'warning' | 'error' | 'critical';

// ---------------------------------------------------------------------------
// ApiIssueType — all detectable API surface problems
// ---------------------------------------------------------------------------
export type ApiIssueType =
  // Export completeness
  | 'missing_export'
  | 'dead_export'
  | 'unreachable_module'
  // Naming
  | 'naming_inconsistency'
  | 'type_export_missing'
  // Contract
  | 'contract_violation'
  | 'signature_mismatch'
  | 'missing_index_barrel'
  // Changes
  | 'breaking_change'
  | 'non_breaking_change'
  // Policy
  | 'policy_violation'
  | 'undocumented_export';

// ---------------------------------------------------------------------------
// ApiChangeKind — classification of API surface changes
// ---------------------------------------------------------------------------
export type ApiChangeKind = 'breaking' | 'non_breaking' | 'addition' | 'removal' | 'none';

// ---------------------------------------------------------------------------
// ApiExport — a single export entry from a package's public API
// ---------------------------------------------------------------------------
export interface ApiExport {
  /** The exported symbol name */
  symbolName: string;
  /** 'value' = class/function/const, 'type' = interface/type alias */
  kind: 'value' | 'type' | 'namespace';
  /** Source file relative to the package root */
  sourceFile: string;
  /** Whether the symbol appears in src/index.ts barrel */
  isBarreled: boolean;
  /** Whether a corresponding implementation file exists */
  hasImplementation: boolean;
  /** Whether the symbol is explicitly documented */
  isDocumented: boolean;
}

// ---------------------------------------------------------------------------
// ApiSurface — the complete Public API snapshot for one package
// ---------------------------------------------------------------------------
export interface ApiSurface {
  /** The package name (e.g. @web-factor/builder-sdk) */
  packageName: string;
  /** Workspace-relative path to src/index.ts */
  barrelPath: string;
  /** Whether the barrel file exists */
  hasBarrel: boolean;
  /** All exports declared in the barrel */
  barreledExports: ApiExport[];
  /** All symbols found in implementation files */
  implementationExports: ApiExport[];
}

// ---------------------------------------------------------------------------
// ApiContract — a formal contract for a package's Public API
// ---------------------------------------------------------------------------
export interface ApiContract {
  packageName: string;
  /** Snapshot of required exports (symbol names) */
  requiredExports: string[];
  /** Snapshot of explicitly forbidden symbols (internal / private) */
  forbiddenExports: string[];
  /** Whether the contract has been formally declared */
  isDeclared: boolean;
}

// ---------------------------------------------------------------------------
// ApiChange — a detected change between two API surface snapshots
// ---------------------------------------------------------------------------
export interface ApiChange {
  /** Package where the change occurred */
  packageName: string;
  kind: ApiChangeKind;
  /** Symbol that was added, removed or modified */
  symbolName: string;
  /** Description of what changed */
  description: string;
}

// ---------------------------------------------------------------------------
// ApiIssue — a single problem detected during analysis
// ---------------------------------------------------------------------------
export interface ApiIssue {
  id: string;
  issueType: ApiIssueType;
  severity: ApiSeverity;
  message: string;
  /** Package where the issue was found */
  packageName: string;
  /** The specific symbol involved, if applicable */
  symbolName?: string;
  targetPath?: string;
  /** Guidance on remediation */
  recommendation?: string;
  /** Whether this issue represents a breaking API change */
  isBreaking?: boolean;
}

// ---------------------------------------------------------------------------
// ApiAssessment — aggregated summary produced by the Validator
// ---------------------------------------------------------------------------
export interface ApiAssessment {
  totalIssues: number;
  infoCount: number;
  warningCount: number;
  errorCount: number;
  criticalCount: number;
  /** Count of breaking-change issues */
  breakingChangeCount: number;
  /** Issues grouped by type */
  byType: Partial<Record<ApiIssueType, ApiIssue[]>>;
  /** Issues grouped by package */
  byPackage: Record<string, ApiIssue[]>;
}

// ---------------------------------------------------------------------------
// ApiReport — full report produced by the Report Generator
// ---------------------------------------------------------------------------
export interface ApiReport {
  generatedAt: string;
  rootPath: string;
  /** Score from 0 (critically broken) to 100 (fully compliant) */
  apiHealthScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  assessment: ApiAssessment;
  issues: ApiIssue[];
  /** All detected API changes, sorted by kind */
  changes: ApiChange[];
  /** Total packages analysed */
  packageCount: number;
  recommendations: string[];
}
