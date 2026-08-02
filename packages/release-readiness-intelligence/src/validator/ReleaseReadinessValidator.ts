import type {
  ReleaseGate,
  ReleaseGateCategory,
  ReleaseGateResult,
  ReleaseMetric,
  ReleaseReadinessAssessment,
  ReleaseRecommendation,
  ReleaseRisk,
  ReleaseSeverity,
  ReleaseSnapshot,
  ReleaseStatus,
} from '../model/ReleaseReadinessModel';

// ---------------------------------------------------------------------------
// Quantitative limit thresholds for Release Readiness
// ---------------------------------------------------------------------------
const LIMIT_MAX_BLOCKER_RISKS = 0;
const LIMIT_MAX_FAILED_MANDATORY_GATES = 0;

// ---------------------------------------------------------------------------
// ReleaseReadinessValidator — gate evaluation, risk classification, status derivation
// ---------------------------------------------------------------------------
export class ReleaseReadinessValidator {

  // ─── Gate Evaluation ──────────────────────────────────────────────────────

  /**
   * Evaluate all defined Quality Gates against repository snapshot and risks.
   */
  public static evaluateGates(
    gates: ReleaseGate[],
    snapshot: ReleaseSnapshot,
    risks: ReleaseRisk[]
  ): ReleaseGateResult[] {
    const results: ReleaseGateResult[] = [];
    const intel = snapshot.intelligence;

    for (const gate of gates) {
      let passed = true;
      let message = 'Gate passed successfully.';
      let remediation: string | undefined;
      let score: number | undefined;

      switch (gate.category) {
        case 'architecture_freeze':
          passed = snapshot.hasArchitectureFreezeDoc && snapshot.isArchitectureFreezeApproved;
          message = passed
            ? 'Architecture Freeze specification is present and APPROVED.'
            : 'Architecture Freeze document is missing or NOT APPROVED.';
          remediation = passed ? undefined : 'Complete Architecture Freeze document and obtain approval.';
          break;

        case 'public_api_stability':
          const breaking = intel.breakingChangeCount ?? 0;
          passed = breaking === 0;
          message = passed
            ? 'Zero unhandled breaking changes in Public API.'
            : `${breaking} unhandled breaking API change(s) detected.`;
          remediation = passed ? undefined : 'Revert breaking changes or update semver major version.';
          break;

        case 'configuration_completeness':
          const missingCfg = intel.configMissingCount ?? 0;
          passed = missingCfg === 0;
          message = passed
            ? 'All package configurations are complete.'
            : `${missingCfg} missing configuration file(s).`;
          remediation = passed ? undefined : 'Generate missing tsconfig or package.json files.';
          break;

        case 'security_compliance':
          const secCrit = intel.securityCriticalCount ?? 0;
          passed = secCrit === 0;
          score = intel.securityHealthScore;
          message = passed
            ? `Security scan passed (Score: ${score}/100, 0 critical findings).`
            : `${secCrit} critical security finding(s) detected.`;
          remediation = passed ? undefined : 'Resolve all critical security findings.';
          break;

        case 'dependency_health':
          const cycles = intel.cycleCount ?? 0;
          passed = cycles === 0;
          score = intel.dependencyHealthScore;
          message = passed
            ? `Dependency graph healthy (Score: ${score}/100, 0 cycles).`
            : `${cycles} circular dependency cycle(s) detected.`;
          remediation = passed ? undefined : 'Refactor dependency cycles.';
          break;

        case 'performance_standards':
          score = intel.performanceHealthScore ?? 100;
          passed = score >= 80;
          message = passed
            ? `Performance Health Score is ${score}/100 (>=80).`
            : `Performance Health Score is ${score}/100 (<80).`;
          remediation = passed ? undefined : 'Address architectural performance hotspots.';
          break;

        case 'documentation_completeness':
          score = intel.documentationHealthScore ?? 100;
          passed = score >= 80;
          message = passed
            ? `Documentation Health Score is ${score}/100 (>=80).`
            : `Documentation Health Score is ${score}/100 (<80).`;
          remediation = passed ? undefined : 'Improve README coverage and document missing topics.';
          break;

        default:
          const categoryRisks = risks.filter((r) => r.category === gate.category && r.isBlocker);
          passed = categoryRisks.length === 0;
          message = passed ? 'Quality Gate passed.' : `${categoryRisks.length} blocking risk(s) in category.`;
      }

      results.push({
        gateId: gate.gateId,
        gateName: gate.name,
        category: gate.category,
        passed,
        isMandatory: gate.isMandatory,
        score,
        message,
        remediation,
      });
    }

    return results;
  }

  // ─── Status Derivation ───────────────────────────────────────────────────

  /**
   * Derive release status:
   * - 'Ready': All mandatory gates pass, 0 blocker risks, 0 failed non-mandatory gates
   * - 'Conditionally Ready': All mandatory gates pass, 0 blocker risks, but non-mandatory gates failed
   * - 'Not Ready': Any mandatory gate fails OR blocker risks exist
   */
  public static deriveStatus(
    gateResults: ReleaseGateResult[],
    risks: ReleaseRisk[]
  ): ReleaseStatus {
    const failedMandatory = gateResults.some((g) => g.isMandatory && !g.passed);
    const blockerRisks    = risks.some((r) => r.isBlocker);

    if (failedMandatory || blockerRisks) {
      return 'Not Ready';
    }

    const failedNonMandatory = gateResults.some((g) => !g.isMandatory && !g.passed);
    if (failedNonMandatory) {
      return 'Conditionally Ready';
    }

    return 'Ready';
  }

  // ─── Core Assessment ─────────────────────────────────────────────────────

  public static assessReadiness(
    gateResults: ReleaseGateResult[],
    risks: ReleaseRisk[]
  ): ReleaseReadinessAssessment {
    const passedGateCount = gateResults.filter((g) => g.passed).length;
    const failedGateCount = gateResults.filter((g) => !g.passed).length;
    const failedMandatoryGateCount = gateResults.filter((g) => g.isMandatory && !g.passed).length;
    const blockerRiskCount = risks.filter((r) => r.isBlocker).length;

    const status = ReleaseReadinessValidator.deriveStatus(gateResults, risks);
    const metrics = ReleaseReadinessValidator.validateLimits(gateResults, risks);
    const recommendations = ReleaseReadinessValidator.prioritiseRecommendations(gateResults, risks);

    return {
      totalGates: gateResults.length,
      passedGateCount,
      failedGateCount,
      failedMandatoryGateCount,
      totalRisks: risks.length,
      blockerRiskCount,
      overallStatus: status,
      metrics,
      recommendations,
    };
  }

  // ─── Limit Validation ────────────────────────────────────────────────────

  public static validateLimits(
    gateResults: ReleaseGateResult[],
    risks: ReleaseRisk[]
  ): ReleaseMetric[] {
    const blockerCount = risks.filter((r) => r.isBlocker).length;
    const failedMandatoryCount = gateResults.filter((g) => g.isMandatory && !g.passed).length;
    const totalGatePassRate = gateResults.length > 0
      ? gateResults.filter((g) => g.passed).length / gateResults.length
      : 1;

    return [
      {
        metricName: 'blockerRiskCount',
        value: blockerCount,
        targetValue: LIMIT_MAX_BLOCKER_RISKS,
        passing: blockerCount <= LIMIT_MAX_BLOCKER_RISKS,
        unit: 'risks',
      },
      {
        metricName: 'failedMandatoryGateCount',
        value: failedMandatoryCount,
        targetValue: LIMIT_MAX_FAILED_MANDATORY_GATES,
        passing: failedMandatoryCount <= LIMIT_MAX_FAILED_MANDATORY_GATES,
        unit: 'gates',
      },
      {
        metricName: 'gatePassRate',
        value: Math.round(totalGatePassRate * 100) / 100,
        targetValue: 1.0,
        passing: totalGatePassRate >= 1.0,
        unit: 'ratio',
      },
    ];
  }

  // ─── Recommendation Prioritisation ───────────────────────────────────────

  public static prioritiseRecommendations(
    gateResults: ReleaseGateResult[],
    risks: ReleaseRisk[]
  ): ReleaseRecommendation[] {
    const recs: ReleaseRecommendation[] = [];
    let priority = 1;

    const failedGates = gateResults.filter((g) => !g.passed);

    // Mandatory failed gates -> P1
    for (const fg of failedGates.filter((g) => g.isMandatory)) {
      recs.push({
        priority: priority++,
        category: fg.category,
        title: `Fulfill Mandatory Gate: ${fg.gateName}`,
        description: `${fg.message}${fg.remediation ? ` Remediation: ${fg.remediation}` : ''}`,
        estimatedImpact: 'high',
        effort: 'medium',
      });
    }

    // Blocker risks -> P2
    for (const r of risks.filter((rk) => rk.isBlocker)) {
      recs.push({
        priority: priority++,
        category: r.category,
        title: `Resolve Release Blocker: ${r.title}`,
        description: `${r.description}${r.mitigation ? ` Mitigation: ${r.mitigation}` : ''}`,
        estimatedImpact: 'high',
        effort: 'medium',
      });
    }

    // Non-mandatory failed gates -> P3
    for (const fg of failedGates.filter((g) => !g.isMandatory)) {
      recs.push({
        priority: priority++,
        category: fg.category,
        title: `Address Quality Gate: ${fg.gateName}`,
        description: fg.message,
        estimatedImpact: 'medium',
        effort: 'low',
      });
    }

    return recs;
  }

  // ─── Classification Utilities ─────────────────────────────────────────────

  public static sortBySeverity(risks: ReleaseRisk[]): ReleaseRisk[] {
    const order: Record<ReleaseSeverity, number> = {
      critical: 0, error: 1, warning: 2, info: 3,
    };
    return [...risks].sort((a, b) => order[a.severity] - order[b.severity]);
  }

  public static filterBlockers(risks: ReleaseRisk[]): ReleaseRisk[] {
    return risks.filter((r) => r.isBlocker);
  }
}
