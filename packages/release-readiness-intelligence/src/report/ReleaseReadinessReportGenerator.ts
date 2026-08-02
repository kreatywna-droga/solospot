import type {
  ReleaseGate,
  ReleaseGateResult,
  ReleaseReadinessAssessment,
  ReleaseRecommendation,
  ReleaseReport,
  ReleaseRisk,
  ReleaseSnapshot,
  ReleaseStatus,
} from '../model/ReleaseReadinessModel';
import { ReleaseReadinessValidator } from '../validator/ReleaseReadinessValidator';

export type ReleaseReportData = ReleaseReport;

// ---------------------------------------------------------------------------
// ReleaseReadinessReportGenerator
// ---------------------------------------------------------------------------
export class ReleaseReadinessReportGenerator {

  // ─── Main Generator ───────────────────────────────────────────────────────

  public static generateReport(
    assessment: ReleaseReadinessAssessment,
    gateResults: ReleaseGateResult[],
    risks: ReleaseRisk[],
    snapshot: ReleaseSnapshot,
    gates: ReleaseGate[] = [],
    rootPath = '.'
  ): ReleaseReport {
    const score   = ReleaseReadinessReportGenerator.calculateScore(assessment, gateResults);
    const unfulfilled = gateResults.filter((g) => !g.passed);
    const sortedRisks = ReleaseReadinessValidator.sortBySeverity(risks);
    const recs    = ReleaseReadinessValidator.prioritiseRecommendations(gateResults, risks);

    return {
      generatedAt: new Date().toISOString(),
      rootPath,
      targetVersion: snapshot.targetVersion,
      releaseReadinessScore: score,
      status: assessment.overallStatus,
      assessment,
      gateResults,
      unfulfilledGates: unfulfilled,
      risks: sortedRisks,
      recommendations: recs,
    };
  }

  // ─── Score Calculation ───────────────────────────────────────────────────

  public static calculateScore(
    assessment: ReleaseReadinessAssessment,
    gateResults: ReleaseGateResult[]
  ): number {
    if (gateResults.length === 0) return 100;

    const mandatory = gateResults.filter((g) => g.isMandatory);
    const optional  = gateResults.filter((g) => !g.isMandatory);

    const mandatoryPassRatio = mandatory.length > 0
      ? mandatory.filter((g) => g.passed).length / mandatory.length
      : 1;
    const optionalPassRatio = optional.length > 0
      ? optional.filter((g) => g.passed).length / optional.length
      : 1;

    // Weight: 70% mandatory gates ratio, 30% optional gates ratio
    const rawScore = (mandatoryPassRatio * 70) + (optionalPassRatio * 30);
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  }

  // ─── Markdown Export ──────────────────────────────────────────────────────

  public static toMarkdown(report: ReleaseReport): string {
    const statusEmoji = report.status === 'Ready'
      ? '🟢 READY'
      : report.status === 'Conditionally Ready'
        ? '🟡 CONDITIONALLY READY'
        : '🔴 NOT READY';

    const lines: string[] = [
      '# Release Readiness Intelligence Report',
      '',
      `> Target Version: \`${report.targetVersion}\`  `,
      `> Release Status: **${statusEmoji}**  `,
      `> Readiness Score: **${report.releaseReadinessScore} / 100**  `,
      `> Generated: ${report.generatedAt}  `,
      `> Root: \`${report.rootPath}\``,
      '',
      '---',
      '',
      '## Summary',
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| **Release Status** | **${report.status}** |`,
      `| **Readiness Score** | ${report.releaseReadinessScore} / 100 |`,
      `| **Total Gates** | ${report.assessment.totalGates} |`,
      `| Passed Gates | ${report.assessment.passedGateCount} / ${report.assessment.totalGates} |`,
      `| Failed Mandatory Gates | ${report.assessment.failedMandatoryGateCount} |`,
      `| Total Release Risks | ${report.assessment.totalRisks} |`,
      `| Blocker Risks | ${report.assessment.blockerRiskCount} |`,
      '',
      '---',
      '',
      '## Quality Gates Status',
      '',
      '| Gate ID | Name | Category | Mandatory | Status | Outcome |',
      '|---------|------|----------|-----------|--------|---------|',
    ];

    for (const g of report.gateResults) {
      const passTag = g.passed ? '✅ PASS' : '❌ FAIL';
      const mandatoryTag = g.isMandatory ? 'Yes' : 'No';
      lines.push(`| \`${g.gateId}\` | ${g.gateName} | ${g.category} | ${mandatoryTag} | ${passTag} | ${g.message} |`);
    }

    lines.push('', '---', '', '## Prioritised Recommendations', '');

    if (report.recommendations.length === 0) {
      lines.push('_All Quality Gates passed and no blocker risks detected. Ready for release._');
    } else {
      for (const rec of report.recommendations) {
        lines.push(`### P${rec.priority} — ${rec.title} [Impact: ${rec.estimatedImpact.toUpperCase()}] [Effort: ${rec.effort.toUpperCase()}]`);
        lines.push('');
        lines.push(rec.description);
        lines.push('');
      }
    }

    if (report.unfulfilledGates.length > 0) {
      lines.push('---', '', '## Unfulfilled Quality Gates', '');
      for (const fg of report.unfulfilledGates) {
        lines.push(`### [${fg.isMandatory ? 'MANDATORY BLOCKER' : 'WARNING'}] ${fg.gateId}: ${fg.gateName}`);
        lines.push('');
        lines.push(`- **Category**: ${fg.category}`);
        lines.push(`- **Message**: ${fg.message}`);
        if (fg.remediation) lines.push(`- **Remediation**: ${fg.remediation}`);
        lines.push('');
      }
    }

    if (report.risks.length > 0) {
      lines.push('---', '', '## Release Risks', '');
      for (const r of report.risks) {
        const blockerTag = r.isBlocker ? ' 🛑 BLOCKER' : '';
        lines.push(`### [${r.severity.toUpperCase()}] ${r.title}${blockerTag}`);
        lines.push('');
        lines.push(`- **ID**: \`${r.id}\``);
        lines.push(`- **Category**: ${r.category}`);
        lines.push(`- **Description**: ${r.description}`);
        if (r.mitigation) lines.push(`- **Mitigation**: ${r.mitigation}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  // ─── JSON Export ──────────────────────────────────────────────────────────

  public static toJSON(report: ReleaseReport): string {
    return JSON.stringify(report, null, 2);
  }
}
