export type SecuritySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type SecurityCategory = 'exposure' | 'dependency' | 'sandbox' | 'policy' | 'contract';

export interface SecurityFinding {
  id: string;
  category: SecurityCategory;
  severity: SecuritySeverity;
  message: string;
  targetPath?: string;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  disallowWildcardPermissions: boolean;
  requireIframeIsolation: boolean;
  disallowDirectDOMMutationInPlugins: boolean;
}

export interface SecurityRisk {
  riskId: string;
  score: number;
  description: string;
}

export interface SecurityAssessment {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  id: 'policy_platform_strict',
  name: 'Platform Strict Security Policy',
  disallowWildcardPermissions: true,
  requireIframeIsolation: true,
  disallowDirectDOMMutationInPlugins: true,
};
