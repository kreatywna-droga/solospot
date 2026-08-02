import { ProjectMetricsSummary } from '../metrics/CodeMetricsEngine';
import { QualityFinding } from '../quality/QualityAnalyzer';

export interface ProjectHealthReport {
  timestamp: string;
  healthScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: ProjectMetricsSummary;
  warningsCount: number;
  errorsCount: number;
  findings: QualityFinding[];
  recommendations: string[];
}

export class HealthReportGenerator {
  public static calculateHealthScore(summary: ProjectMetricsSummary, findings: QualityFinding[]): number {
    let score = 100;

    // Deduct for errors and warnings
    for (const f of findings) {
      if (f.severity === 'error') score -= 15;
      else if (f.severity === 'warning') score -= 5;
      else if (f.severity === 'info') score -= 1;
    }

    // Deduct if average module size > 300 lines
    if (summary.averageLinesPerFile > 300) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  public static getGrade(score: number): ProjectHealthReport['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  public static generateReport(summary: ProjectMetricsSummary, findings: QualityFinding[]): ProjectHealthReport {
    const healthScore = HealthReportGenerator.calculateHealthScore(summary, findings);
    const grade = HealthReportGenerator.getGrade(healthScore);
    const errorsCount = findings.filter(f => f.severity === 'error').length;
    const warningsCount = findings.filter(f => f.severity === 'warning').length;

    const recommendations: string[] = [];
    if (errorsCount > 0) {
      recommendations.push(`Resolve ${errorsCount} critical package structure errors.`);
    }
    if (warningsCount > 0) {
      recommendations.push(`Review ${warningsCount} potential orphan modules or missing manifests.`);
    }
    if (summary.averageLinesPerFile > 300) {
      recommendations.push(`Refactor large modules (average ${summary.averageLinesPerFile} lines/file).`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Maintain current high quality standards and clean architectural isolation.');
    }

    return {
      timestamp: new Date().toISOString(),
      healthScore,
      grade,
      metrics: summary,
      warningsCount,
      errorsCount,
      findings,
      recommendations,
    };
  }

  public static toMarkdown(report: ProjectHealthReport): string {
    const lines: string[] = [];

    lines.push('# Project Health & Quality Report');
    lines.push('');
    lines.push(`- **Execution Timestamp:** \`${report.timestamp}\``);
    lines.push(`- **Overall Health Score:** **${report.healthScore} / 100** (Grade: **${report.grade}**)`);
    lines.push(`- **Warnings:** ${report.warningsCount} | **Errors:** ${report.errorsCount}`);
    lines.push('');

    lines.push('## Code Metrics Summary');
    lines.push('');
    lines.push(`- **Total Files:** ${report.metrics.totalFiles}`);
    lines.push(`- **Total Lines of Code:** ${report.metrics.totalLines}`);
    lines.push(`- **Average Lines / File:** ${report.metrics.averageLinesPerFile}`);
    lines.push(`- **Total Exports:** ${report.metrics.totalExports}`);
    lines.push(`- **Total Interfaces:** ${report.metrics.totalInterfaces}`);
    lines.push(`- **Total Types:** ${report.metrics.totalTypes}`);
    lines.push(`- **Total Classes:** ${report.metrics.totalClasses}`);
    lines.push(`- **Total Functions:** ${report.metrics.totalFunctions}`);
    lines.push('');

    lines.push('## Key Recommendations');
    lines.push('');
    for (const rec of report.recommendations) {
      lines.push(`- 💡 ${rec}`);
    }
    lines.push('');

    if (report.findings.length > 0) {
      lines.push('## Detailed Findings');
      lines.push('');
      lines.push('| Category | Severity | Message | File |');
      lines.push('|----------|----------|---------|------|');
      for (const f of report.findings) {
        lines.push(`| ${f.category} | ${f.severity.toUpperCase()} | ${f.message} | \`${f.filePath || 'global'}\` |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  public static toJSON(report: ProjectHealthReport): string {
    return JSON.stringify(report, null, 2);
  }
}
