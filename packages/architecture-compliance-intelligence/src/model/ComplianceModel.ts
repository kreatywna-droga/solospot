// ---------------------------------------------------------------------------
// ComplianceSeverity — urgency of a detected architectural violation
// ---------------------------------------------------------------------------
export type ComplianceSeverity = 'info' | 'warning' | 'error' | 'critical';

// ---------------------------------------------------------------------------
// ArchitectureLayer — logical tiers in the reference architecture
// ---------------------------------------------------------------------------
export type ArchitectureLayer =
  | 'ui'
  | 'application'
  | 'domain'
  | 'infrastructure'
  | 'platform'
  | 'shared'
  | 'external';

// ---------------------------------------------------------------------------
// ViolationType — categories of detectable architectural violations
// ---------------------------------------------------------------------------
export type ViolationType =
  | 'layer_violation'
  | 'forbidden_dependency'
  | 'module_boundary_breach'
  | 'adr_violation'
  | 'separation_of_concerns'
  | 'circular_layer_dependency'
  | 'missing_abstraction_layer'
  | 'direct_infrastructure_access';

// ---------------------------------------------------------------------------
// ArchitectureRule — a single architectural constraint to be enforced
// ---------------------------------------------------------------------------
export interface ArchitectureRule {
  /** Unique rule identifier (e.g. "RULE-001") */
  ruleId: string;
  /** Human-readable rule name */
  name: string;
  /** The source layer that this rule applies to */
  fromLayer: ArchitectureLayer;
  /** The target layer that is affected by this rule */
  toLayer: ArchitectureLayer;
  /** Whether dependencies from fromLayer → toLayer are allowed */
  allowed: boolean;
  /** Associated ADR identifier, if any */
  adrId?: string;
  /** Severity when this rule is violated */
  violationSeverity: ComplianceSeverity;
  /** Explanation of why this rule exists */
  rationale?: string;
}

// ---------------------------------------------------------------------------
// ArchitectureViolation — a single detected breach of an ArchitectureRule
// ---------------------------------------------------------------------------
export interface ArchitectureViolation {
  id: string;
  ruleId: string;
  violationType: ViolationType;
  severity: ComplianceSeverity;
  message: string;
  /** The module/package that declares the forbidden dependency */
  sourceModule: string;
  /** The module/package being incorrectly imported */
  targetModule: string;
  /** The architectural layer of the source */
  sourceLayer: ArchitectureLayer;
  /** The architectural layer of the target */
  targetLayer: ArchitectureLayer;
  /** The specific import path or dependency name that caused the violation */
  dependencyPath?: string;
  /** Associated ADR, if the rule is ADR-backed */
  adrId?: string;
  recommendation?: string;
}

// ---------------------------------------------------------------------------
// ComplianceMetric — a quantitative compliance indicator
// ---------------------------------------------------------------------------
export interface ComplianceMetric {
  metricName: string;
  value: number;
  targetValue: number;
  passing: boolean;
  unit?: string;
}

// ---------------------------------------------------------------------------
// ComplianceRecommendation — a prioritised architectural fix suggestion
// ---------------------------------------------------------------------------
export interface ComplianceRecommendation {
  priority: number;
  violationType: ViolationType;
  title: string;
  description: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// ModuleDescriptor — lightweight snapshot of one package/module for analysis
// ---------------------------------------------------------------------------
export interface ModuleDescriptor {
  /** Workspace-relative module path or package name */
  modulePath: string;
  /** The architectural layer this module belongs to */
  layer: ArchitectureLayer;
  /** Direct dependency paths declared by this module */
  dependencies: string[];
  /** Map of dependency path → layer (for cross-reference) */
  dependencyLayers: Record<string, ArchitectureLayer>;
  /** ADR identifiers this module claims to comply with */
  declaredAdrIds?: string[];
}

// ---------------------------------------------------------------------------
// ComplianceAssessment — aggregated result produced by the Validator
// ---------------------------------------------------------------------------
export interface ComplianceAssessment {
  totalViolations: number;
  infoCount: number;
  warningCount: number;
  errorCount: number;
  criticalCount: number;
  /** Violations grouped by violation type */
  byType: Partial<Record<ViolationType, ArchitectureViolation[]>>;
  /** Violations grouped by rule ID */
  byRule: Record<string, ArchitectureViolation[]>;
  /** Computed compliance metrics */
  metrics: ComplianceMetric[];
  /** Ordered recommendations */
  recommendations: ComplianceRecommendation[];
}

// ---------------------------------------------------------------------------
// ComplianceReport — full report produced by the Report Generator
// ---------------------------------------------------------------------------
export interface ComplianceReport {
  generatedAt: string;
  rootPath: string;
  /** Score from 0 (critically non-compliant) to 100 (fully compliant) */
  complianceScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  assessment: ComplianceAssessment;
  violations: ArchitectureViolation[];
  recommendations: ComplianceRecommendation[];
  /** Number of modules analysed */
  moduleCount: number;
  /** Number of rules evaluated */
  ruleCount: number;
  /** Rules that had zero violations */
  passingRuleCount: number;
}
