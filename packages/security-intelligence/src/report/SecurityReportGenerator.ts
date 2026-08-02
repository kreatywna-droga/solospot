import type {
  SecurityAssessment,
  SecurityFileSnapshot,
  SecurityFinding,
  SecurityPolicy,
  SecurityReport,
  SecurityRecommendation,
} from '../model/SecurityModel';
import { SecurityValidator } from '../validator/SecurityValidator';

// ---------------------------------------------------------------------------
// Score → Grade thresholds
// ---------------------------------------------------------------------------
const GRADE_THRESHOLDS: Array<{ min: number; grade: SecurityReport['grade'] }> = [
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

export type SecurityReportData = SecurityReport;

// ---------------------------------------------------------------------------
// SecurityReportGenerator
// ---------------------------------------------------------------------------
export class SecurityReportGenerator {

  // ─── Main Generator ───────────────────────────────────────────────────────

  public static generateReport(
    assessment: SecurityAssessment,
    findings: SecurityFinding[],
    files: SecurityFileSnapshot[],
    policies: SecurityPolicy[] = [],
    rootPath = '.'
  ): SecurityReport {
    const score  = SecurityReportGenerator.calculateScore(assessment);
    const grade  = SecurityReportGenerator.deriveGrade(score);
    const sorted = SecurityValidator.sortBySeverity(findings);
    const recs   = SecurityValidator.prioritiseRecommendations(findings);

    return {
      generatedAt: new Date().toISOString(),
      rootPath,
      securityHealthScore: score,
      grade,
      assessment,
      findings: sorted,
      recommendations: recs,
      scannedFileCount: files.length,
      policyCount: policies.length,
    };
  }

  // ─── Score ────────────────────────────────────────────────────────────────

  public static calculateScore(assessment: SecurityAssessment): number {
    const penalty =
      assessment.criticalCount * PENALTY.critical +
      assessment.errorCount    * PENALTY.error    +
      assessment.warningCount  * PENALTY.warning  +
      assessment.infoCount     * PENALTY.info;

    return Math.max(0, Math.min(100, Math.round(100 - penalty)));
  }

  // ─── Grade ────────────────────────────────────────────────────────────────

  public static deriveGrade(score: number): SecurityReport['grade'] {
    for (const { min, grade } of GRADE_THRESHOLDS) {
      if (score >= min) return grade;
    }
    return 'F';
  }

  // ─── Markdown Export ──────────────────────────────────────────────────────

  public static toMarkdown(report: SecurityReport): string {
    const lines: string[] = [
      '# Security Intelligence Health Report',
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
      `| **Security Health Score** | ${report.securityHealthScore} / 100 |`,
      `| **Grade** | ${report.grade} |`,
      `| **Total Findings** | ${report.assessment.totalFindings} |`,
      `| Critical | ${report.assessment.criticalCount} |`,
      `| Errors | ${report.assessment.errorCount} |`,
      `| Warnings | ${report.assessment.warningCount} |`,
      `| Info | ${report.assessment.infoCount} |`,
      `| Scanned Files | ${report.scannedFileCount} |`,
      `| Security Policies Evaluated | ${report.policyCount} |`,
      `| Policy Pass Rate | ${Math.round(report.assessment.policyPassRate * 100)}% |`,
      '',
      '---',
      '',
      '## Prioritised Recommendations',
      '',
    ];

    if (report.recommendations.length === 0) {
      lines.push('_No security risks detected — all scans clean._');
    } else {
      for (const rec of report.recommendations) {
        lines.push(`### P${rec.priority} — ${rec.title} [Impact: ${rec.estimatedImpact.toUpperCase()}] [Effort: ${rec.effort.toUpperCase()}]`);
        lines.push('');
        lines.push(rec.description);
        lines.push('');
      }
    }

    lines.push('---', '', '## Security Findings', '');

    if (report.findings.length === 0) {
      lines.push('_No findings detected._');
    } else {
      for (const f of report.findings) {
        lines.push(`### [${f.severity.toUpperCase()}] ${f.findingType} — \`${f.filePath}\``);
        lines.push('');
        lines.push(`- **ID**: \`${f.id}\``);
        lines.push(`- **Category**: ${f.category}`);
        lines.push(`- **Message**: ${f.message}`);
        if (f.lineNumber) lines.push(`- **Line**: ${f.lineNumber}`);
        if (f.snippet) lines.push(`- **Snippet**: \`${f.snippet}\``);
        if (f.policyId) lines.push(`- **Policy Breach**: \`${f.policyId}\``);
        if (f.recommendation) lines.push(`- **Fix**: ${f.recommendation}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  // ─── JSON Export ──────────────────────────────────────────────────────────

  public static toJSON(report: SecurityReport): string {
    return JSON.stringify(report, null, 2);
  }
}
