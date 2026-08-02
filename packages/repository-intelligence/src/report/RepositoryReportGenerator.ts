import type {
  RepositoryAssessment,
  RepositoryIssue,
  RepositoryReport,
  RepositoryStructure,
} from '../model/RepositoryModel';
import { RepositoryValidator } from '../validator/RepositoryValidator';

// ---------------------------------------------------------------------------
// Score → Grade mapping
// ---------------------------------------------------------------------------
const GRADE_THRESHOLDS: Array<{ min: number; grade: RepositoryReport['grade'] }> = [
  { min: 97, grade: 'A+' },
  { min: 90, grade: 'A' },
  { min: 80, grade: 'B' },
  { min: 65, grade: 'C' },
  { min: 50, grade: 'D' },
  { min: 0,  grade: 'F' },
];

// Penalty per issue severity
const PENALTY: Record<string, number> = {
  critical: 25,
  error: 15,
  warning: 5,
  info: 1,
};

// ---------------------------------------------------------------------------
// Public report data type
// ---------------------------------------------------------------------------
export type RepositoryReportData = RepositoryReport;

// ---------------------------------------------------------------------------
// RepositoryReportGenerator
// ---------------------------------------------------------------------------
export class RepositoryReportGenerator {
  // ─── Main Generator ───────────────────────────────────────────────────────

  public static generateReport(
    assessment: RepositoryAssessment,
    issues: RepositoryIssue[],
    structure: Pick<RepositoryStructure, 'rootPath' | 'maxDepth' | 'packageCount'>
  ): RepositoryReport {
    const score = RepositoryReportGenerator.calculateScore(assessment);
    const grade = RepositoryReportGenerator.deriveGrade(score);
    const sortedIssues = RepositoryValidator.sortBySeverity(issues);
    const recommendations = RepositoryReportGenerator.buildRecommendations(sortedIssues, assessment);

    return {
      generatedAt: new Date().toISOString(),
      rootPath: structure.rootPath,
      repositoryHealthScore: score,
      grade,
      assessment,
      issues: sortedIssues,
      structure,
      recommendations,
    };
  }

  // ─── Score Calculation ────────────────────────────────────────────────────

  public static calculateScore(assessment: RepositoryAssessment): number {
    const penalty =
      assessment.criticalCount * PENALTY.critical +
      assessment.errorCount    * PENALTY.error    +
      assessment.warningCount  * PENALTY.warning  +
      assessment.infoCount     * PENALTY.info;

    return Math.max(0, Math.min(100, 100 - penalty));
  }

  // ─── Grade Derivation ─────────────────────────────────────────────────────

  public static deriveGrade(score: number): RepositoryReport['grade'] {
    for (const { min, grade } of GRADE_THRESHOLDS) {
      if (score >= min) return grade;
    }
    return 'F';
  }

  // ─── Recommendations ─────────────────────────────────────────────────────

  public static buildRecommendations(
    issues: RepositoryIssue[],
    assessment: RepositoryAssessment
  ): string[] {
    const recs: string[] = [];

    if (assessment.criticalCount > 0) {
      recs.push(`❌ Address ${assessment.criticalCount} critical issue(s) immediately — they block safe repository operation.`);
    }
    if (assessment.errorCount > 0) {
      recs.push(`🔴 Fix ${assessment.errorCount} error(s) — packages with missing conventions will not integrate correctly.`);
    }
    if (assessment.warningCount > 0) {
      recs.push(`🟡 Investigate ${assessment.warningCount} warning(s) — structural issues that may grow into errors over time.`);
    }

    const emptyDirs = issues.filter((i) => i.issueType === 'empty_directory');
    if (emptyDirs.length > 0) {
      recs.push(`🗂️  Remove or justify ${emptyDirs.length} empty director${emptyDirs.length === 1 ? 'y' : 'ies'} to keep the repository clean.`);
    }

    const deepDirs = issues.filter((i) => i.issueType === 'excessive_depth');
    if (deepDirs.length > 0) {
      recs.push(`📂 Flatten ${deepDirs.length} over-nested director${deepDirs.length === 1 ? 'y' : 'ies'} to improve discoverability.`);
    }

    const duplicates = issues.filter((i) => i.issueType === 'duplicate_structure');
    if (duplicates.length > 0) {
      recs.push(`🔁 Review ${duplicates.length} duplicate structure signature(s) — consolidate if unintentional.`);
    }

    const namingIssues = issues.filter((i) => i.issueType === 'inconsistent_naming');
    if (namingIssues.length > 0) {
      recs.push(`🏷️  Rename ${namingIssues.length} package director${namingIssues.length === 1 ? 'y' : 'ies'} to use kebab-case.`);
    }

    if (assessment.totalIssues === 0) {
      recs.push('✅ Repository structure is fully compliant — no issues detected.');
    }

    return recs;
  }

  // ─── Markdown Export ──────────────────────────────────────────────────────

  public static toMarkdown(report: RepositoryReport): string {
    const lines: string[] = [
      '# Repository Intelligence Health Report',
      '',
      `> Generated: ${report.generatedAt}  `,
      `> Root: \`${report.rootPath}\``,
      '',
      '---',
      '',
      '## Summary',
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| **Health Score** | ${report.repositoryHealthScore} / 100 |`,
      `| **Grade** | ${report.grade} |`,
      `| **Total Issues** | ${report.assessment.totalIssues} |`,
      `| Critical | ${report.assessment.criticalCount} |`,
      `| Errors | ${report.assessment.errorCount} |`,
      `| Warnings | ${report.assessment.warningCount} |`,
      `| Info | ${report.assessment.infoCount} |`,
      `| Max Directory Depth | ${report.structure.maxDepth} |`,
      `| Package Count | ${report.structure.packageCount} |`,
      '',
      '---',
      '',
      '## Recommendations',
      '',
      ...report.recommendations.map((r) => `- ${r}`),
      '',
      '---',
      '',
      '## Issues',
      '',
    ];

    if (report.issues.length === 0) {
      lines.push('_No issues detected._');
    } else {
      for (const iss of report.issues) {
        lines.push(`### [${iss.severity.toUpperCase()}] ${iss.issueType}`);
        lines.push('');
        lines.push(`- **ID**: \`${iss.id}\``);
        lines.push(`- **Message**: ${iss.message}`);
        if (iss.targetPath) lines.push(`- **Path**: \`${iss.targetPath}\``);
        if (iss.recommendation) lines.push(`- **Fix**: ${iss.recommendation}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  // ─── JSON Export ──────────────────────────────────────────────────────────

  public static toJSON(report: RepositoryReport): string {
    return JSON.stringify(report, null, 2);
  }
}
