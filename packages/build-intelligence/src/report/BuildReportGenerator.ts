import { BuildIssue, BuildAssessment } from '../model/BuildModel';

export interface BuildReportData {
  buildHealthScore: number;
  grade: string;
  totalIssues: number;
  warningCount: number;
  errorCount: number;
  issues: BuildIssue[];
  recommendations: string[];
}

export class BuildReportGenerator {
  public static generateReport(assessment: BuildAssessment, issues: BuildIssue[]): BuildReportData {
    const penaltyPerError = 15;
    const penaltyPerWarning = 5;
    const score = Math.max(
      0,
      100 - assessment.errorCount * penaltyPerError - assessment.warningCount * penaltyPerWarning
    );

    let grade = 'F';
    if (score >= 95) grade = 'A+';
    else if (score >= 85) grade = 'A';
    else if (score >= 75) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 40) grade = 'D';

    const recommendations: string[] = [];
    if (assessment.errorCount > 0) {
      recommendations.push('Resolve all ERROR-level build configuration issues before releasing.');
    }
    if (assessment.warningCount > 0) {
      recommendations.push('Enable strict mode and declaration output in all tsconfig.json files.');
    }
    if (score === 100) {
      recommendations.push('Build configuration is fully compliant. No action required.');
    }

    return {
      buildHealthScore: score,
      grade,
      totalIssues: assessment.totalIssues,
      warningCount: assessment.warningCount,
      errorCount: assessment.errorCount,
      issues,
      recommendations,
    };
  }

  public static toMarkdown(report: BuildReportData): string {
    const lines: string[] = [
      '# Build Intelligence Health Analysis Report',
      '',
      `**Build Health Score:** ${report.buildHealthScore} / 100  (Grade: ${report.grade})`,
      `**Total Issues:** ${report.totalIssues}  |  Errors: ${report.errorCount}  |  Warnings: ${report.warningCount}`,
      '',
      '## Detected Issues',
      '',
    ];

    if (report.issues.length === 0) {
      lines.push('_No issues detected._');
    } else {
      for (const iss of report.issues) {
        lines.push(`- [${iss.severity.toUpperCase()}] \`${iss.issueType}\` — ${iss.message}`);
      }
    }

    lines.push('', '## Recommendations', '');
    for (const rec of report.recommendations) {
      lines.push(`- ${rec}`);
    }

    return lines.join('\n');
  }

  public static toJSON(report: BuildReportData): string {
    return JSON.stringify(report, null, 2);
  }
}
