// ---------------------------------------------------------------------------
// SecuritySeverity — urgency level of a security risk finding
// ---------------------------------------------------------------------------
export type SecuritySeverity = 'info' | 'warning' | 'error' | 'critical';

// ---------------------------------------------------------------------------
// SecurityCategory — domain of security risk
// ---------------------------------------------------------------------------
export type SecurityCategory =
  | 'hardcoded_secrets'
  | 'unsafe_code_patterns'
  | 'dangerous_dependencies'
  | 'policy_compliance'
  | 'least_privilege'
  | 'configuration_risk';

// ---------------------------------------------------------------------------
// SecurityFindingType — specific security risk types
// ---------------------------------------------------------------------------
export type SecurityFindingType =
  | 'secret_detected'
  | 'api_key_hardcoded'
  | 'private_key_exposed'
  | 'unsafe_eval'
  | 'inner_html_injection'
  | 'insecure_random'
  | 'disabled_ssl_verification'
  | 'vulnerable_dependency'
  | 'wildcard_cors_origin'
  | 'missing_security_policy'
  | 'excessive_permission'
  | 'debug_mode_enabled'
  | 'insecure_cookie_setting';

// ---------------------------------------------------------------------------
// SecurityPolicy — a formal security rule/policy definition
// ---------------------------------------------------------------------------
export interface SecurityPolicy {
  /** Unique policy identifier (e.g. "SEC-POL-001") */
  policyId: string;
  name: string;
  category: SecurityCategory;
  /** Severity level when this policy is breached */
  severity: SecuritySeverity;
  /** Whether enforcement is required */
  enforced: boolean;
  description?: string;
}

// ---------------------------------------------------------------------------
// SecurityFinding — a single detected security issue
// ---------------------------------------------------------------------------
export interface SecurityFinding {
  id: string;
  findingType: SecurityFindingType;
  category: SecurityCategory;
  severity: SecuritySeverity;
  message: string;
  /** Workspace-relative file path where the risk was detected */
  filePath: string;
  /** Line number if available */
  lineNumber?: number;
  /** Redacted evidence snippet */
  snippet?: string;
  /** Associated security policy ID, if applicable */
  policyId?: string;
  recommendation?: string;
}

// ---------------------------------------------------------------------------
// SecurityRecommendation — prioritised security remediation guidance
// ---------------------------------------------------------------------------
export interface SecurityRecommendation {
  priority: number;
  category: SecurityCategory;
  title: string;
  description: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// SecurityFileSnapshot — lightweight metadata & content snapshot of a file
// ---------------------------------------------------------------------------
export interface SecurityFileSnapshot {
  filePath: string;
  /** File content for static analysis */
  content: string;
  /** Extension (e.g. ".ts", ".env", ".json") */
  extension: string;
  /** Package name if inside a monorepo package */
  packageName?: string;
}

// ---------------------------------------------------------------------------
// SecurityAssessment — aggregated analysis result produced by the Validator
// ---------------------------------------------------------------------------
export interface SecurityAssessment {
  totalFindings: number;
  infoCount: number;
  warningCount: number;
  errorCount: number;
  criticalCount: number;
  /** Findings grouped by category */
  byCategory: Partial<Record<SecurityCategory, SecurityFinding[]>>;
  /** Findings grouped by finding type */
  byType: Partial<Record<SecurityFindingType, SecurityFinding[]>>;
  /** Policy compliance pass rate (0..1) */
  policyPassRate: number;
  /** Ordered recommendations */
  recommendations: SecurityRecommendation[];
}

// ---------------------------------------------------------------------------
// SecurityReport — full report produced by the Report Generator
// ---------------------------------------------------------------------------
export interface SecurityReport {
  generatedAt: string;
  rootPath: string;
  /** Score from 0 (critically insecure) to 100 (highly secure) */
  securityHealthScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  assessment: SecurityAssessment;
  findings: SecurityFinding[];
  recommendations: SecurityRecommendation[];
  /** Number of files scanned */
  scannedFileCount: number;
  /** Number of policies evaluated */
  policyCount: number;
}
