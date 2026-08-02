import type {
  ApiAssessment,
  ApiChange,
  ApiIssue,
  ApiReport,
  ApiSurface,
} from '../model/ApiSurfaceModel';
import { ApiSurfaceValidator } from '../validator/ApiSurfaceValidator';

// ---------------------------------------------------------------------------
// Score → Grade thresholds
// ---------------------------------------------------------------------------
const GRADE_THRESHOLDS: Array<{ min: number; grade: ApiReport['grade'] }> = [
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
  error:    15,
  warning:  5,
  info:     1,
};

export type ApiReportData = ApiReport;

// ---------------------------------------------------------------------------
// ApiSurfaceReportGenerator
// ---------------------------------------------------------------------------
export class ApiSurfaceReportGenerator {

  // ─── Main Generator ───────────────────────────────────────────────────────

  public static generateReport(
    assessment: ApiAssessment,
    issues: ApiIssue[],
    surfaces: ApiSurface[],
    changes: ApiChange[] = [],
    rootPath = '.'
  ): ApiReport {
    const score = ApiSurfaceReportGenerator.calculateScore(assessment);
    const grade = ApiSurfaceReportGenerator.deriveGrade(score);
    const sortedIssues = ApiSurfaceValidator.sortBySeverity(issues);
    const recommendations = ApiSurfaceReportGenerator.buildRecommendations(sortedIssues, assessment);

    return {
      generatedAt: new Date().toISOString(),
      rootPath,
      apiHealthScore: score,
      grade,
      assessment,
      issues: sortedIssues,
      changes,
      packageCount: surfaces.length,
      recommendations,
    };
  }

  // ─── Score ────────────────────────────────────────────────────────────────

  public static calculateScore(assessment: ApiAssessment): number {
    const penalty =
      assessment.criticalCount * PENALTY.critical +
      assessment.errorCount    * PENALTY.error    +
      assessment.warningCount  * PENALTY.warning  +
      assessment.infoCount     * PENALTY.info;

    return Math.max(0, Math.min(100, 100 - penalty));
  }

  // ─── Grade ────────────────────────────────────────────────────────────────

  public static deriveGrade(score: number): ApiReport['grade'] {
    for (const { min, grade } of GRADE_THRESHOLDS) {
      if (score >= min) return grade;
    }
    return 'F';
  }

  // ─── Recommendations ─────────────────────────────────────────────────────

  public static buildRecommendations(
    issues: ApiIssue[],
    assessment: ApiAssessment
  ): string[] {
    const recs: string[] = [];

    if (assessment.criticalCount > 0) {
      recs.push(`❌ Fix ${assessment.criticalCount} contract violation(s) immediately — the Public API no longer satisfies declared contracts.`);
    }
    if (assessment.breakingChangeCount > 0) {
      recs.push(`🔴 ${assessment.breakingChangeCount} breaking change(s) detected — increment the major version of affected packages or revert the changes.`);
    }
    if (assessment.errorCount > 0) {
      recs.push(`🔴 Resolve ${assessment.errorCount} error(s) — dead exports and policy violations indicate API rot.`);
    }
    if (assessment.warningCount > 0) {
      recs.push(`🟡 Address ${assessment.warningCount} warning(s) — missing exports and naming issues reduce API discoverability.`);
    }

    const deadExports = issues.filter((i) => i.issueType === 'dead_export');
    if (deadExports.length > 0) {
      recs.push(`🪦 Remove or implement ${deadExports.length} dead export(s) — they clutter the API surface with unreachable symbols.`);
    }

    const missingExports = issues.filter((i) => i.issueType === 'missing_export');
    if (missingExports.length > 0) {
      recs.push(`📤 Add ${missingExports.length} missing export(s) to the appropriate barrel files so consumers can access these symbols.`);
    }

    const missingBarrels = issues.filter((i) => i.issueType === 'missing_index_barrel');
    if (missingBarrels.length > 0) {
      recs.push(`📄 Create ${missingBarrels.length} missing src/index.ts barrel(s) — packages without a barrel have no Public API.`);
    }

    const unreachable = issues.filter((i) => i.issueType === 'unreachable_module');
    if (unreachable.length > 0) {
      recs.push(`🔒 Evaluate ${unreachable.length} unreachable module(s) — either expose them via the barrel or mark them as internal.`);
    }

    const undocumented = issues.filter((i) => i.issueType === 'undocumented_export');
    if (undocumented.length > 0) {
      recs.push(`📝 Document ${undocumented.length} public export(s) with JSDoc/TSDoc to improve API discoverability.`);
    }

    if (assessment.totalIssues === 0) {
      recs.push('✅ All API surfaces are fully compliant — no issues detected.');
    }

    return recs;
  }

  // ─── Markdown Export ──────────────────────────────────────────────────────

  public static toMarkdown(report: ApiReport): string {
    const lines: string[] = [
      '# API Surface Intelligence Health Report',
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
      `| **Health Score** | ${report.apiHealthScore} / 100 |`,
      `| **Grade** | ${report.grade} |`,
      `| **Total Issues** | ${report.assessment.totalIssues} |`,
      `| Breaking Changes | ${report.assessment.breakingChangeCount} |`,
      `| Critical | ${report.assessment.criticalCount} |`,
      `| Errors | ${report.assessment.errorCount} |`,
      `| Warnings | ${report.assessment.warningCount} |`,
      `| Info | ${report.assessment.infoCount} |`,
      `| Packages Analysed | ${report.packageCount} |`,
      '',
    ];

    // API Changes section
    if (report.changes.length > 0) {
      lines.push('---', '', '## API Changes', '');
      const breaking = report.changes.filter((c) => c.kind === 'breaking' || c.kind === 'removal');
      const nonBreaking = report.changes.filter((c) => c.kind !== 'breaking' && c.kind !== 'removal');

      if (breaking.length > 0) {
        lines.push('### ⚠️ Breaking Changes', '');
        for (const c of breaking) {
          lines.push(`- **[${c.packageName}]** \`${c.symbolName}\`: ${c.description}`);
        }
        lines.push('');
      }
      if (nonBreaking.length > 0) {
        lines.push('### ✅ Non-Breaking Changes', '');
        for (const c of nonBreaking) {
          lines.push(`- **[${c.packageName}]** \`${c.symbolName}\`: ${c.description}`);
        }
        lines.push('');
      }
    }

    lines.push('---', '', '## Recommendations', '');
    lines.push(...report.recommendations.map((r) => `- ${r}`));
    lines.push('', '---', '', '## Issues', '');

    if (report.issues.length === 0) {
      lines.push('_No issues detected._');
    } else {
      for (const iss of report.issues) {
        const breakingTag = iss.isBreaking ? ' 🔴 BREAKING' : '';
        lines.push(`### [${iss.severity.toUpperCase()}] ${iss.issueType}${breakingTag}`);
        lines.push('');
        lines.push(`- **ID**: \`${iss.id}\``);
        lines.push(`- **Package**: ${iss.packageName}`);
        lines.push(`- **Message**: ${iss.message}`);
        if (iss.symbolName) lines.push(`- **Symbol**: \`${iss.symbolName}\``);
        if (iss.targetPath) lines.push(`- **Path**: \`${iss.targetPath}\``);
        if (iss.recommendation) lines.push(`- **Fix**: ${iss.recommendation}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  // ─── JSON Export ──────────────────────────────────────────────────────────

  public static toJSON(report: ApiReport): string {
    return JSON.stringify(report, null, 2);
  }
}
