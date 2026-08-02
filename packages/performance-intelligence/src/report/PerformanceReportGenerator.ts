import type {
  PerformanceAssessment,
  PerformanceIssue,
  PerformanceModuleSnapshot,
  PerformanceReport,
  PerformanceRecommendation,
} from '../model/PerformanceModel';
import { PerformanceValidator } from '../validator/PerformanceValidator';

// ---------------------------------------------------------------------------
// Score → Grade thresholds
// ---------------------------------------------------------------------------
const GRADE_THRESHOLDS: Array<{ min: number; grade: PerformanceReport['grade'] }> = [
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

export type PerformanceReportData = PerformanceReport;

// ---------------------------------------------------------------------------
// PerformanceReportGenerator
// ---------------------------------------------------------------------------
export class PerformanceReportGenerator {

  // ─── Main Generator ───────────────────────────────────────────────────────

  public static generateReport(
    assessment: PerformanceAssessment,
    issues: PerformanceIssue[],
    modules: PerformanceModuleSnapshot[],
    rootPath = '.'
  ): PerformanceReport {
    const score   = PerformanceReportGenerator.calculateScore(assessment);
    const grade   = PerformanceReportGenerator.deriveGrade(score);
    const sorted  = PerformanceValidator.sortBySeverity(issues);
    const recs    = PerformanceValidator.prioritiseRecommendations(issues);

    return {
      generatedAt: new Date().toISOString(),
      rootPath,
      performanceHealthScore: score,
      grade,
      assessment,
      issues: sorted,
      recommendations: recs,
      moduleCount: modules.length,
    };
  }

  // ─── Score ────────────────────────────────────────────────────────────────

  public static calculateScore(assessment: PerformanceAssessment): number {
    const penalty =
      assessment.criticalCount * PENALTY.critical +
      assessment.errorCount    * PENALTY.error    +
      assessment.warningCount  * PENALTY.warning  +
      assessment.infoCount     * PENALTY.info;

    return Math.max(0, Math.min(100, 100 - penalty));
  }

  // ─── Grade ────────────────────────────────────────────────────────────────

  public static deriveGrade(score: number): PerformanceReport['grade'] {
    for (const { min, grade } of GRADE_THRESHOLDS) {
      if (score >= min) return grade;
    }
    return 'F';
  }

  // ─── Markdown Export ──────────────────────────────────────────────────────

  public static toMarkdown(report: PerformanceReport): string {
    const lines: string[] = [
      '# Performance Intelligence Health Report',
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
      `| **Performance Health Score** | ${report.performanceHealthScore} / 100 |`,
      `| **Grade** | ${report.grade} |`,
      `| **Total Issues** | ${report.assessment.totalIssues} |`,
      `| Critical | ${report.assessment.criticalCount} |`,
      `| Errors | ${report.assessment.errorCount} |`,
      `| Warnings | ${report.assessment.warningCount} |`,
      `| Info | ${report.assessment.infoCount} |`,
      `| Modules Analysed | ${report.moduleCount} |`,
      '',
      '---',
      '',
      '## Prioritised Recommendations',
      '',
    ];

    if (report.recommendations.length === 0) {
      lines.push('_No performance risks detected._');
    } else {
      for (const rec of report.recommendations) {
        const impactTag = `[Impact: ${rec.estimatedImpact.toUpperCase()}]`;
        const effortTag = `[Effort: ${rec.effort.toUpperCase()}]`;
        lines.push(`### P${rec.priority} — ${rec.title} ${impactTag} ${effortTag}`);
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

  public static toJSON(report: PerformanceReport): string {
    return JSON.stringify(report, null, 2);
  }

  // ─── Recommendation Text Builder (for plain text summaries) ──────────────

  public static buildRecommendationSummary(recs: PerformanceRecommendation[]): string[] {
    return recs.map(
      (r) => `P${r.priority} [${r.estimatedImpact.toUpperCase()} impact / ${r.effort} effort] ${r.title}: ${r.description}`
    );
  }
}
