import type {
  SecurityAssessment,
  SecurityCategory,
  SecurityFinding,
  SecurityFindingType,
  SecurityPolicy,
  SecurityRecommendation,
  SecuritySeverity,
} from '../model/SecurityModel';

// ---------------------------------------------------------------------------
// Organisational Security Limits
// ---------------------------------------------------------------------------
const LIMIT_MAX_CRITICAL_FINDINGS = 0;
const LIMIT_MAX_SECRETS           = 0;
const LIMIT_MIN_POLICY_PASS_RATE  = 1.0; // 100% policy pass rate required

export interface SecurityMetric {
  metricName: string;
  value: number;
  targetValue: number;
  passing: boolean;
  unit?: string;
}

// ---------------------------------------------------------------------------
// SecurityValidator — threat classification, policy validation, prioritisation
// ---------------------------------------------------------------------------
export class SecurityValidator {

  // ─── Core Assessment ─────────────────────────────────────────────────────

  /**
   * Aggregate a raw finding list into a SecurityAssessment.
   * Read-only — no code modifications, no auto-remediations.
   */
  public static assessFindings(
    findings: SecurityFinding[],
    policies: SecurityPolicy[] = []
  ): SecurityAssessment {
    const byCategory: Partial<Record<SecurityCategory, SecurityFinding[]>> = {};
    const byType: Partial<Record<SecurityFindingType, SecurityFinding[]>> = {};

    let infoCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let criticalCount = 0;

    for (const f of findings) {
      if (!byCategory[f.category]) byCategory[f.category] = [];
      byCategory[f.category]!.push(f);

      if (!byType[f.findingType]) byType[f.findingType] = [];
      byType[f.findingType]!.push(f);

      switch (f.severity) {
        case 'info':     infoCount++;     break;
        case 'warning':  warningCount++;  break;
        case 'error':    errorCount++;    break;
        case 'critical': criticalCount++; break;
      }
    }

    // Policy pass rate calculation
    const enforced = policies.filter((p) => p.enforced);
    const brokenPolicyIds = new Set(findings.map((f) => f.policyId).filter(Boolean));
    const passedPolicies = enforced.filter((p) => !brokenPolicyIds.has(p.policyId)).length;
    const policyPassRate = enforced.length > 0 ? passedPolicies / enforced.length : 1;

    const recommendations = SecurityValidator.prioritiseRecommendations(findings);

    return {
      totalFindings: findings.length,
      infoCount,
      warningCount,
      errorCount,
      criticalCount,
      byCategory,
      byType,
      policyPassRate: Math.round(policyPassRate * 100) / 100,
      recommendations,
    };
  }

  // ─── Limit Validation ────────────────────────────────────────────────────

  /**
   * Validate measured security values against established security limits.
   */
  public static validateLimits(
    findings: SecurityFinding[],
    policies: SecurityPolicy[] = []
  ): SecurityMetric[] {
    const criticalCount = findings.filter((f) => f.severity === 'critical').length;
    const secretCount   = findings.filter((f) => f.category === 'hardcoded_secrets').length;

    const enforced = policies.filter((p) => p.enforced);
    const brokenPolicyIds = new Set(findings.map((f) => f.policyId).filter(Boolean));
    const passedPolicies = enforced.filter((p) => !brokenPolicyIds.has(p.policyId)).length;
    const policyPassRate = enforced.length > 0 ? passedPolicies / enforced.length : 1;

    return [
      {
        metricName: 'criticalFindingCount',
        value: criticalCount,
        targetValue: LIMIT_MAX_CRITICAL_FINDINGS,
        passing: criticalCount <= LIMIT_MAX_CRITICAL_FINDINGS,
        unit: 'findings',
      },
      {
        metricName: 'hardcodedSecretCount',
        value: secretCount,
        targetValue: LIMIT_MAX_SECRETS,
        passing: secretCount <= LIMIT_MAX_SECRETS,
        unit: 'secrets',
      },
      {
        metricName: 'policyPassRate',
        value: Math.round(policyPassRate * 100) / 100,
        targetValue: LIMIT_MIN_POLICY_PASS_RATE,
        passing: policyPassRate >= LIMIT_MIN_POLICY_PASS_RATE,
        unit: 'ratio',
      },
    ];
  }

  // ─── Recommendation Prioritisation ───────────────────────────────────────

  /**
   * Derive a prioritised list of SecurityRecommendation objects.
   */
  public static prioritiseRecommendations(findings: SecurityFinding[]): SecurityRecommendation[] {
    const recs: SecurityRecommendation[] = [];
    let priority = 1;

    const groups: Array<{
      category: SecurityCategory;
      types: SecurityFindingType[];
      title: string;
      description: string;
      impact: SecurityRecommendation['estimatedImpact'];
      effort: SecurityRecommendation['effort'];
    }> = [
      {
        category: 'hardcoded_secrets',
        types: ['secret_detected', 'api_key_hardcoded', 'private_key_exposed'],
        title: 'Revoke and Remove Hardcoded Secrets',
        description: 'Hardcoded API keys, tokens, and private keys expose the application to unauthorized access.',
        impact: 'high',
        effort: 'low',
      },
      {
        category: 'unsafe_code_patterns',
        types: ['unsafe_eval'],
        title: 'Eliminate Dynamic Code Execution (eval)',
        description: 'Dynamic code evaluation introduces severe Remote Code Execution (RCE) vulnerabilities.',
        impact: 'high',
        effort: 'medium',
      },
      {
        category: 'dangerous_dependencies',
        types: ['vulnerable_dependency'],
        title: 'Remove Malicious or Vulnerable Dependencies',
        description: 'Vulnerable or flagged dependencies expose the build and runtime environments.',
        impact: 'high',
        effort: 'medium',
      },
      {
        category: 'configuration_risk',
        types: ['disabled_ssl_verification', 'debug_mode_enabled'],
        title: 'Fix Insecure Configuration Settings',
        description: 'Disabled SSL verification and debug flags in production expose traffic and internal logs.',
        impact: 'high',
        effort: 'low',
      },
      {
        category: 'least_privilege',
        types: ['wildcard_cors_origin', 'excessive_permission'],
        title: 'Enforce Least-Privilege CORS Policies',
        description: 'Wildcard CORS origins allow unauthorized origins to invoke sensitive API endpoints.',
        impact: 'medium',
        effort: 'low',
      },
      {
        category: 'unsafe_code_patterns',
        types: ['inner_html_injection', 'insecure_random'],
        title: 'Sanitise DOM Content and Use Crypto Randoms',
        description: 'Direct innerHTML usage risks XSS; Math.random() is vulnerable to PRNG prediction.',
        impact: 'medium',
        effort: 'medium',
      },
    ];

    for (const group of groups) {
      const matches = findings.filter((f) => group.types.includes(f.findingType));
      if (matches.length > 0) {
        recs.push({
          priority: priority++,
          category: group.category,
          title: group.title,
          description: `${group.description} (${matches.length} instance${matches.length > 1 ? 's' : ''} detected)`,
          estimatedImpact: group.impact,
          effort: group.effort,
        });
      }
    }

    return recs;
  }

  // ─── Classification Utilities ─────────────────────────────────────────────

  /** Sort findings: critical → error → warning → info. */
  public static sortBySeverity(findings: SecurityFinding[]): SecurityFinding[] {
    const order: Record<SecuritySeverity, number> = {
      critical: 0, error: 1, warning: 2, info: 3,
    };
    return [...findings].sort((a, b) => order[a.severity] - order[b.severity]);
  }

  /** Filter findings by category. */
  public static filterByCategory(
    findings: SecurityFinding[],
    category: SecurityCategory
  ): SecurityFinding[] {
    return findings.filter((f) => f.category === category);
  }

  /** Filter findings by severity. */
  public static filterBySeverity(
    findings: SecurityFinding[],
    severity: SecuritySeverity
  ): SecurityFinding[] {
    return findings.filter((f) => f.severity === severity);
  }
}
