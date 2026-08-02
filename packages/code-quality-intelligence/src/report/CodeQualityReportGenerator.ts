import type {
  CodeQualityAssessment,
  CodeQualityFileSnapshot,
  CodeQualityIssue,
  CodeQualityReport,
} from '../model/CodeQualityModel';
import { CodeQualityValidator } from '../validator/CodeQualityValidator';

// ---------------------------------------------------------------------------
// Score → Grade thresholds
// ---------------------------------------------------------------------------
const GRADE_THRESHOLDS: Array<{ min: number; grade: CodeQualityReport['grade'] }> = [
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

export type CodeQualityReportData = CodeQualityReport;

// ---------------------------------------------------------------------------
// CodeQualityReportGenerator
// ---------------------------------------------------------------------------
export class CodeQualityReportGenerator {

  // ─── Main Generator ───────────────────────────────────────────────────────

  public static generateReport(
    assessment: CodeQualityAssessment,
    issues: CodeQualityIssue[],
    files: CodeQualityFileSnapshot[],
    rootPath = '.'
  ): CodeQualityReport {
    const score  = CodeQualityReportGenerator.calculateScore(assessment);
    const grade  = CodeQualityReportGenerator.deriveGrade(score);
    const sorted = CodeQualityValidator.sortBySeverity(issues);
    const recs   = CodeQualityValidator.prioritiseRecommendations(issues);

    const totalLines = files.reduce((s, f) => s + f.lineCount, 0);

    return {
      generatedAt: new Date().toISOString(),
      rootPath,
      codeQualityHealthScore: score,
      grade,
      assessment,
      issues: sorted,
      recommendations: recs,
      scannedFileCount: files.length,
      totalLinesOfCode: totalLines,
    };
  }

  // ─── Score ────────────────────────────────────────────────────────────────

  public static calculateScore(assessment: CodeQualityAssessment): number {
    const penalty =
      assessment.criticalCount * PENALTY.critical +
      assessment.errorCount    * PENALTY.error    +
      assessment.warningCount  * PENALTY.warning  +
      assessment.infoCount     * PENALTY.info;

    // Weight Maintainability Index (30% weight) and penalty (70% weight)
    const baseScore = Math.max(0, 100 - penalty);
    const weightedScore = (baseScore * 0.7) + (assessment.maintainabilityIndex * 0.3);

    return Math.max(0, Math.min(100, Math.round(weightedScore)));
  }

  // ─── Grade ────────────────────────────────────────────────────────────────

  public static deriveGrade(score: number): CodeQualityReport['grade'] {
    for (const { min, grade } of GRADE_THRESHOLDS) {
      if (score >= min) return grade;
    }
    return 'F';
  }

  // ─── Markdown Export ──────────────────────────────────────────────────────

  public static toMarkdown(report: CodeQualityReport): string {
    const lines: string[] = [
      '# Code Quality Intelligence Health Report',
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
      `| **Code Quality Health Score** | ${report.codeQualityHealthScore} / 100 |`,
      `| **Grade** | ${report.grade} |`,
      `| **Maintainability Index** | ${report.assessment.maintainabilityIndex} / 100 |`,
      `| **Total Issues** | ${report.assessment.totalIssues} |`,
      `| Critical | ${report.assessment.criticalCount} |`,
      `| Errors | ${report.assessment.errorCount} |`,
      `| Warnings | ${report.assessment.warningCount} |`,
      `| Info | ${report.assessment.infoCount} |`,
      `| Scanned Files | ${report.scannedFileCount} |`,
      `| Total Lines of Code | ${report.totalLinesOfCode} |`,
      '',
      '---',
      '',
      '## Prioritised Recommendations',
      '',
    ];

    if (report.recommendations.length === 0) {
      lines.push('_No code quality issues detected — repository clean._');
    } else {
      for (const rec of report.recommendations) {
        lines.push(`### P${rec.priority} — ${rec.title} [Impact: ${rec.estimatedImpact.toUpperCase()}] [Effort: ${rec.effort.toUpperCase()}]`);
        lines.push('');
        lines.push(rec.description);
        lines.push('');
      }
    }

    lines.push('---', '', '## Code Quality Issues', '');

    if (report.issues.length === 0) {
      lines.push('_No issues detected._');
    } else {
      for (const iss of report.issues) {
        lines.push(`### [${iss.severity.toUpperCase()}] ${iss.issueType} — \`${iss.filePath}\``);
        lines.push('');
        lines.push(`- **ID**: \`${iss.id}\``);
        lines.push(`- **Category**: ${iss.category}`);
        lines.push(`- **Message**: ${iss.message}`);
        if (iss.lineNumber) lines.push(`- **Line**: ${iss.lineNumber}`);
        if (iss.symbolName) lines.push(`- **Symbol**: \`${iss.symbolName}\``);
        if (iss.measuredValue !== undefined && iss.threshold !== undefined) {
          lines.push(`- **Measured**: ${iss.measuredValue} (threshold: ${iss.threshold})`);
        }
        if (iss.recommendation) lines.push(`- **Fix**: ${iss.recommendation}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  // ─── JSON Export ──────────────────────────────────────────────────────────

  public static toJSON(report: CodeQualityReport): string {
    return JSON.stringify(report, null, 2);
  }
}
