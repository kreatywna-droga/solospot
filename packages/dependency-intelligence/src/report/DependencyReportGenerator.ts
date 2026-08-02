import type {
  DependencyAssessment,
  DependencyIssue,
  DependencyNode,
  DependencyReport,
} from '../model/DependencyModel';
import { DependencyAnalyzer } from '../analyzer/DependencyAnalyzer';
import { DependencyValidator } from '../validator/DependencyValidator';

// ---------------------------------------------------------------------------
// Score → Grade thresholds
// ---------------------------------------------------------------------------
const GRADE_THRESHOLDS: Array<{ min: number; grade: DependencyReport['grade'] }> = [
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

export type DependencyReportData = DependencyReport;

// ---------------------------------------------------------------------------
// DependencyReportGenerator
// ---------------------------------------------------------------------------
export class DependencyReportGenerator {

  // ─── Main Generator ───────────────────────────────────────────────────────

  public static generateReport(
    assessment: DependencyAssessment,
    issues: DependencyIssue[],
    nodes: DependencyNode[],
    rootPath = '.'
  ): DependencyReport {
    const score  = DependencyReportGenerator.calculateScore(assessment);
    const grade  = DependencyReportGenerator.deriveGrade(score);
    const sorted = DependencyValidator.sortBySeverity(issues);
    const recs   = DependencyValidator.prioritiseRecommendations(issues);

    const edges = DependencyAnalyzer.buildEdges(nodes);

    return {
      generatedAt: new Date().toISOString(),
      rootPath,
      dependencyHealthScore: score,
      grade,
      assessment,
      issues: sorted,
      recommendations: recs,
      totalNodeCount: nodes.length,
      totalEdgeCount: edges.length,
    };
  }

  // ─── Score ────────────────────────────────────────────────────────────────

  public static calculateScore(assessment: DependencyAssessment): number {
    const penalty =
      assessment.criticalCount * PENALTY.critical +
      assessment.errorCount    * PENALTY.error    +
      assessment.warningCount  * PENALTY.warning  +
      assessment.infoCount     * PENALTY.info;

    return Math.max(0, Math.min(100, Math.round(100 - penalty)));
  }

  // ─── Grade ────────────────────────────────────────────────────────────────

  public static deriveGrade(score: number): DependencyReport['grade'] {
    for (const { min, grade } of GRADE_THRESHOLDS) {
      if (score >= min) return grade;
    }
    return 'F';
  }

  // ─── Markdown Export ──────────────────────────────────────────────────────

  public static toMarkdown(report: DependencyReport): string {
    const lines: string[] = [
      '# Dependency Intelligence Health Report',
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
      `| **Dependency Health Score** | ${report.dependencyHealthScore} / 100 |`,
      `| **Grade** | ${report.grade} |`,
      `| **Max Graph Depth** | ${report.assessment.maxGraphDepth} levels |`,
      `| **Total Issues** | ${report.assessment.totalIssues} |`,
      `| Critical | ${report.assessment.criticalCount} |`,
      `| Errors | ${report.assessment.errorCount} |`,
      `| Warnings | ${report.assessment.warningCount} |`,
      `| Info | ${report.assessment.infoCount} |`,
      `| Total Packages (Nodes) | ${report.totalNodeCount} |`,
      `| Total Dependency Edges | ${report.totalEdgeCount} |`,
      '',
      '---',
      '',
      '## Prioritised Recommendations',
      '',
    ];

    if (report.recommendations.length === 0) {
      lines.push('_No dependency issues detected — graph is healthy._');
    } else {
      for (const rec of report.recommendations) {
        lines.push(`### P${rec.priority} — ${rec.title} [Impact: ${rec.estimatedImpact.toUpperCase()}] [Effort: ${rec.effort.toUpperCase()}]`);
        lines.push('');
        lines.push(rec.description);
        lines.push('');
      }
    }

    lines.push('---', '', '## Dependency Issues', '');

    if (report.issues.length === 0) {
      lines.push('_No issues detected._');
    } else {
      for (const iss of report.issues) {
        lines.push(`### [${iss.severity.toUpperCase()}] ${iss.issueType} — \`${iss.targetPath}\``);
        lines.push('');
        lines.push(`- **ID**: \`${iss.id}\``);
        lines.push(`- **Category**: ${iss.category}`);
        lines.push(`- **Message**: ${iss.message}`);
        if (iss.cyclePath) lines.push(`- **Cycle Path**: ${iss.cyclePath.join(' -> ')}`);
        if (iss.versionDetails) lines.push(`- **Version Details**: ${iss.versionDetails}`);
        if (iss.recommendation) lines.push(`- **Fix**: ${iss.recommendation}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  // ─── JSON Export ────────────────────────────────----------------──────────

  public static toJSON(report: DependencyReport): string {
    return JSON.stringify(report, null, 2);
  }
}
