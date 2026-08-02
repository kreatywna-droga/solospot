import type {
  ArchitectureRule,
  ArchitectureViolation,
  ComplianceAssessment,
  ComplianceReport,
  ComplianceRecommendation,
  ModuleDescriptor,
} from '../model/ComplianceModel';
import { ComplianceAnalyzer } from '../analyzer/ComplianceAnalyzer';
import { ComplianceValidator } from '../validator/ComplianceValidator';

// ---------------------------------------------------------------------------
// Score → Grade thresholds
// ---------------------------------------------------------------------------
const GRADE_THRESHOLDS: Array<{ min: number; grade: ComplianceReport['grade'] }> = [
  { min: 97, grade: 'A+' },
  { min: 90, grade: 'A'  },
  { min: 80, grade: 'B'  },
  { min: 65, grade: 'C'  },
  { min: 50, grade: 'D'  },
  { min: 0,  grade: 'F'  },
];

const PENALTY: Record<string, number> = {
  critical: 25,
  error:    15,
  warning:  5,
  info:     1,
};

export type ComplianceReportData = ComplianceReport;

// ---------------------------------------------------------------------------
// ComplianceReportGenerator
// ---------------------------------------------------------------------------
export class ComplianceReportGenerator {

  // ─── Main Generator ───────────────────────────────────────────────────────

  public static generateReport(
    assessment: ComplianceAssessment,
    violations: ArchitectureViolation[],
    modules: ModuleDescriptor[],
    rules: ArchitectureRule[],
    rootPath = '.'
  ): ComplianceReport {
    const score       = ComplianceReportGenerator.calculateScore(assessment);
    const grade       = ComplianceReportGenerator.deriveGrade(score);
    const sorted      = ComplianceValidator.sortBySeverity(violations);
    const recs        = ComplianceValidator.prioritiseRecommendations(violations);
    const passingRules = ComplianceAnalyzer.passingRuleCount(rules, violations);

    return {
      generatedAt: new Date().toISOString(),
      rootPath,
      complianceScore: score,
      grade,
      assessment,
      violations: sorted,
      recommendations: recs,
      moduleCount: modules.length,
      ruleCount: rules.length,
      passingRuleCount: passingRules,
    };
  }

  // ─── Score ────────────────────────────────────────────────────────────────

  public static calculateScore(assessment: ComplianceAssessment): number {
    const penalty =
      assessment.criticalCount * PENALTY.critical +
      assessment.errorCount    * PENALTY.error    +
      assessment.warningCount  * PENALTY.warning  +
      assessment.infoCount     * PENALTY.info;

    return Math.max(0, Math.min(100, 100 - penalty));
  }

  // ─── Grade ────────────────────────────────────────────────────────────────

  public static deriveGrade(score: number): ComplianceReport['grade'] {
    for (const { min, grade } of GRADE_THRESHOLDS) {
      if (score >= min) return grade;
    }
    return 'F';
  }

  // ─── Markdown Export ──────────────────────────────────────────────────────

  public static toMarkdown(report: ComplianceReport): string {
    const lines: string[] = [
      '# Architecture Compliance Intelligence Report',
      '',
      `> Generated: ${report.generatedAt}  `,
      `> Root: \`${report.rootPath}\``,
      '',
      '---',
      '',
      '## Summary',
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| **Compliance Score** | ${report.complianceScore} / 100 |`,
      `| **Grade** | ${report.grade} |`,
      `| **Total Violations** | ${report.assessment.totalViolations} |`,
      `| Critical | ${report.assessment.criticalCount} |`,
      `| Errors | ${report.assessment.errorCount} |`,
      `| Warnings | ${report.assessment.warningCount} |`,
      `| Info | ${report.assessment.infoCount} |`,
      `| Modules Analysed | ${report.moduleCount} |`,
      `| Rules Evaluated | ${report.ruleCount} |`,
      `| Passing Rules | ${report.passingRuleCount} / ${report.ruleCount} |`,
      '',
      '---',
      '',
      '## Prioritised Recommendations',
      '',
    ];

    if (report.recommendations.length === 0) {
      lines.push('_No architectural violations detected — all rules are passing._');
    } else {
      for (const rec of report.recommendations) {
        lines.push(`### P${rec.priority} — ${rec.title} [Impact: ${rec.estimatedImpact.toUpperCase()}] [Effort: ${rec.effort.toUpperCase()}]`);
        lines.push('');
        lines.push(rec.description);
        lines.push('');
      }
    }

    lines.push('---', '', '## Violations', '');

    if (report.violations.length === 0) {
      lines.push('_No violations detected._');
    } else {
      for (const v of report.violations) {
        lines.push(`### [${v.severity.toUpperCase()}] ${v.violationType} — \`${v.sourceModule}\``);
        lines.push('');
        lines.push(`- **ID**: \`${v.id}\``);
        lines.push(`- **Rule**: ${v.ruleId}`);
        if (v.adrId) lines.push(`- **ADR**: ${v.adrId}`);
        lines.push(`- **Layer**: ${v.sourceLayer} → ${v.targetLayer}`);
        lines.push(`- **Message**: ${v.message}`);
        if (v.dependencyPath) lines.push(`- **Dependency**: \`${v.dependencyPath}\``);
        if (v.recommendation) lines.push(`- **Fix**: ${v.recommendation}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  // ─── JSON Export ──────────────────────────────────────────────────────────

  public static toJSON(report: ComplianceReport): string {
    return JSON.stringify(report, null, 2);
  }
}
