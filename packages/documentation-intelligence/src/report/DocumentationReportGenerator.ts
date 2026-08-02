import type {
  DocumentationArtifact,
  DocumentationAssessment,
  DocumentationCoverage,
  DocumentationIssue,
  DocumentationReport,
  DocumentationRecommendation,
} from '../model/DocumentationModel';
import { DocumentationValidator } from '../validator/DocumentationValidator';

// ---------------------------------------------------------------------------
// Score → Grade thresholds
// ---------------------------------------------------------------------------
const GRADE_THRESHOLDS: Array<{ min: number; grade: DocumentationReport['grade'] }> = [
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

export type DocumentationReportData = DocumentationReport;

// ---------------------------------------------------------------------------
// DocumentationReportGenerator
// ---------------------------------------------------------------------------
export class DocumentationReportGenerator {

  // ─── Main Generator ───────────────────────────────────────────────────────

  public static generateReport(
    assessment: DocumentationAssessment,
    issues: DocumentationIssue[],
    coverage: DocumentationCoverage,
    artifacts: DocumentationArtifact[],
    rootPath = '.'
  ): DocumentationReport {
    const score = DocumentationReportGenerator.calculateScore(assessment, coverage);
    const grade = DocumentationReportGenerator.deriveGrade(score);
    const sorted = DocumentationValidator.sortBySeverity(issues);
    const recs   = DocumentationValidator.prioritiseRecommendations(issues, coverage);

    return {
      generatedAt: new Date().toISOString(),
      rootPath,
      documentationHealthScore: score,
      grade,
      assessment,
      issues: sorted,
      coverage,
      recommendations: recs,
      docCount: artifacts.length,
    };
  }

  // ─── Score ────────────────────────────────────────────────────────────────

  public static calculateScore(
    assessment: DocumentationAssessment,
    coverage: DocumentationCoverage
  ): number {
    const penalty =
      assessment.criticalCount * PENALTY.critical +
      assessment.errorCount    * PENALTY.error    +
      assessment.warningCount  * PENALTY.warning  +
      assessment.infoCount     * PENALTY.info;

    // Bonus based on README and ADR coverage
    const coverageBonus = (coverage.readmeCoverageRate + coverage.adrCoverageRate) * 5; // max 10

    const rawScore = 100 - penalty + coverageBonus;
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  }

  // ─── Grade ────────────────────────────────────────────────────────────────

  public static deriveGrade(score: number): DocumentationReport['grade'] {
    for (const { min, grade } of GRADE_THRESHOLDS) {
      if (score >= min) return grade;
    }
    return 'F';
  }

  // ─── Markdown Export ──────────────────────────────────────────────────────

  public static toMarkdown(report: DocumentationReport): string {
    const lines: string[] = [
      '# Documentation Intelligence Health Report',
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
      `| **Documentation Health Score** | ${report.documentationHealthScore} / 100 |`,
      `| **Grade** | ${report.grade} |`,
      `| **Total Issues** | ${report.assessment.totalIssues} |`,
      `| Critical | ${report.assessment.criticalCount} |`,
      `| Errors | ${report.assessment.errorCount} |`,
      `| Warnings | ${report.assessment.warningCount} |`,
      `| Info | ${report.assessment.infoCount} |`,
      `| Documentation Artifacts | ${report.docCount} |`,
      `| README Coverage | ${Math.round(report.coverage.readmeCoverageRate * 100)}% (${report.coverage.packagesWithReadme}/${report.coverage.totalPackages}) |`,
      `| ADR Coverage | ${Math.round(report.coverage.adrCoverageRate * 100)}% |`,
      `| Orphaned Documents | ${report.coverage.orphanedDocsCount} |`,
      '',
      '---',
      '',
      '## Prioritised Recommendations',
      '',
    ];

    if (report.recommendations.length === 0) {
      lines.push('_No documentation issues detected — all checks passed._');
    } else {
      for (const rec of report.recommendations) {
        lines.push(`### P${rec.priority} — ${rec.title} [Impact: ${rec.estimatedImpact.toUpperCase()}] [Effort: ${rec.effort.toUpperCase()}]`);
        lines.push('');
        lines.push(rec.description);
        lines.push('');
      }
    }

    lines.push('---', '', '## Issues', '');

    if (report.issues.length === 0) {
      lines.push('_No issues detected._');
    } else {
      for (const iss of report.issues) {
        lines.push(`### [${iss.severity.toUpperCase()}] ${iss.issueType} — \`${iss.targetPath}\``);
        lines.push('');
        lines.push(`- **ID**: \`${iss.id}\``);
        lines.push(`- **Category**: ${iss.category}`);
        lines.push(`- **Message**: ${iss.message}`);
        if (iss.recommendation) lines.push(`- **Fix**: ${iss.recommendation}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  // ─── JSON Export ──────────────────────────────────────────────────────────

  public static toJSON(report: DocumentationReport): string {
    return JSON.stringify(report, null, 2);
  }
}
