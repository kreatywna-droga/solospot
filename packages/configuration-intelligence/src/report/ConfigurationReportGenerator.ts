import type {
  ConfigurationArtifact,
  ConfigurationAssessment,
  ConfigurationIssue,
  ConfigurationReport,
  ConfigurationToolType,
} from '../model/ConfigurationModel';
import { ConfigurationValidator } from '../validator/ConfigurationValidator';

// ---------------------------------------------------------------------------
// Score → Grade thresholds
// ---------------------------------------------------------------------------
const GRADE_THRESHOLDS: Array<{ min: number; grade: ConfigurationReport['grade'] }> = [
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

// Public re-export type
export type ConfigurationReportData = ConfigurationReport;

// ---------------------------------------------------------------------------
// ConfigurationReportGenerator
// ---------------------------------------------------------------------------
export class ConfigurationReportGenerator {

  // ─── Main Generator ───────────────────────────────────────────────────────

  public static generateReport(
    assessment: ConfigurationAssessment,
    issues: ConfigurationIssue[],
    artifacts: ConfigurationArtifact[],
    rootPath = '.'
  ): ConfigurationReport {
    const score = ConfigurationReportGenerator.calculateScore(assessment);
    const grade = ConfigurationReportGenerator.deriveGrade(score);
    const sortedIssues = ConfigurationValidator.sortBySeverity(issues);
    const recommendations = ConfigurationReportGenerator.buildRecommendations(sortedIssues, assessment);
    const artifactSummary = ConfigurationReportGenerator.buildArtifactSummary(artifacts);

    return {
      generatedAt: new Date().toISOString(),
      rootPath,
      configurationHealthScore: score,
      grade,
      assessment,
      issues: sortedIssues,
      artifactSummary,
      recommendations,
    };
  }

  // ─── Score ────────────────────────────────────────────────────────────────

  public static calculateScore(assessment: ConfigurationAssessment): number {
    const penalty =
      assessment.criticalCount * PENALTY.critical +
      assessment.errorCount    * PENALTY.error    +
      assessment.warningCount  * PENALTY.warning  +
      assessment.infoCount     * PENALTY.info;

    return Math.max(0, Math.min(100, 100 - penalty));
  }

  // ─── Grade ────────────────────────────────────────────────────────────────

  public static deriveGrade(score: number): ConfigurationReport['grade'] {
    for (const { min, grade } of GRADE_THRESHOLDS) {
      if (score >= min) return grade;
    }
    return 'F';
  }

  // ─── Recommendations ─────────────────────────────────────────────────────

  public static buildRecommendations(
    issues: ConfigurationIssue[],
    assessment: ConfigurationAssessment
  ): string[] {
    const recs: string[] = [];

    if (assessment.criticalCount > 0) {
      recs.push(`❌ Resolve ${assessment.criticalCount} critical issue(s) immediately — they indicate broken configuration.`);
    }
    if (assessment.errorCount > 0) {
      recs.push(`🔴 Fix ${assessment.errorCount} error(s) — packages with missing entries or mismatched aliases will fail to build.`);
    }
    if (assessment.warningCount > 0) {
      recs.push(`🟡 Address ${assessment.warningCount} warning(s) — setting divergence and disabled TypeScript flags accumulate technical debt.`);
    }

    const missing = issues.filter((i) =>
      ['missing_tsconfig', 'missing_package_json', 'missing_eslint_config',
       'missing_prettier_config', 'missing_vitest_config'].includes(i.issueType)
    );
    if (missing.length > 0) {
      recs.push(`📄 Create ${missing.length} missing configuration file(s): ${missing.map((i) => i.targetPath).filter(Boolean).join(', ')}.`);
    }

    const aliasMismatches = issues.filter((i) => i.issueType === 'path_alias_mismatch');
    if (aliasMismatches.length > 0) {
      recs.push(`🔗 Resolve ${aliasMismatches.length} path alias mismatch(es) — conflicting aliases cause import resolution errors.`);
    }

    const divergences = issues.filter((i) => i.issueType === 'setting_divergence');
    if (divergences.length > 0) {
      recs.push(`⚙️  Standardise ${divergences.length} divergent setting(s) across packages — consistency prevents subtle runtime differences.`);
    }

    const tsIssues = issues.filter((i) =>
      ['strict_mode_disabled', 'declaration_disabled', 'incompatible_target'].includes(i.issueType)
    );
    if (tsIssues.length > 0) {
      recs.push(`🔷 Update ${tsIssues.length} TSConfig compiler option(s) to meet the monorepo standard.`);
    }

    if (assessment.totalIssues === 0) {
      recs.push('✅ All configuration files are compliant — no issues detected.');
    }

    return recs;
  }

  // ─── Artifact Summary ─────────────────────────────────────────────────────

  public static buildArtifactSummary(
    artifacts: ConfigurationArtifact[]
  ): ConfigurationReport['artifactSummary'] {
    const ALL_TOOLS: ConfigurationToolType[] = [
      'tsconfig', 'package_json', 'eslint', 'prettier', 'vitest', 'bundler', 'postcss', 'other',
    ];
    const summary = Object.fromEntries(ALL_TOOLS.map((t) => [t, 0])) as ConfigurationReport['artifactSummary'];
    for (const artifact of artifacts) {
      summary[artifact.toolType] = (summary[artifact.toolType] ?? 0) + 1;
    }
    return summary;
  }

  // ─── Markdown Export ──────────────────────────────────────────────────────

  public static toMarkdown(report: ConfigurationReport): string {
    const lines: string[] = [
      '# Configuration Intelligence Health Report',
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
      `| **Health Score** | ${report.configurationHealthScore} / 100 |`,
      `| **Grade** | ${report.grade} |`,
      `| **Total Issues** | ${report.assessment.totalIssues} |`,
      `| Critical | ${report.assessment.criticalCount} |`,
      `| Errors | ${report.assessment.errorCount} |`,
      `| Warnings | ${report.assessment.warningCount} |`,
      `| Info | ${report.assessment.infoCount} |`,
      '',
      '### Artifacts Analysed',
      '',
      '| Tool | Count |',
      '|------|-------|',
      ...Object.entries(report.artifactSummary)
        .filter(([, count]) => count > 0)
        .map(([tool, count]) => `| ${tool} | ${count} |`),
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
        if (iss.targetPath) lines.push(`- **File**: \`${iss.targetPath}\``);
        if (iss.conflictKey) lines.push(`- **Key**: \`${iss.conflictKey}\``);
        if (iss.affectedPackages?.length) lines.push(`- **Packages**: ${iss.affectedPackages.join(', ')}`);
        if (iss.recommendation) lines.push(`- **Fix**: ${iss.recommendation}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  // ─── JSON Export ──────────────────────────────────────────────────────────

  public static toJSON(report: ConfigurationReport): string {
    return JSON.stringify(report, null, 2);
  }
}
