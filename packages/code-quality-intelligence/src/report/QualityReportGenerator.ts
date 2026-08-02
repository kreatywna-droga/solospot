import { ProjectQualityReport } from '../model/QualityModel';

export interface QualityReportData {
  timestamp: string;
  codeQualityScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  report: ProjectQualityReport;
  recommendations: string[];
}

export class QualityReportGenerator {
  public static getGrade(score: number): QualityReportData['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  public static generateReport(projectReport: ProjectQualityReport): QualityReportData {
    const codeQualityScore = projectReport.qualityScore;
    const grade = QualityReportGenerator.getGrade(codeQualityScore);

    const recommendations: string[] = [];
    if (projectReport.issues.some(i => i.category === 'complexity')) {
      recommendations.push('Refactor complex methods to reduce cyclomatic branch count below 15.');
    }
    if (projectReport.issues.some(i => i.category === 'length')) {
      recommendations.push('Split large modules exceeding 300 lines into sub-components or helpers.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Codebase maintainability and quality metrics are excellent.');
    }

    return {
      timestamp: new Date().toISOString(),
      codeQualityScore,
      grade,
      report: projectReport,
      recommendations,
    };
  }

  public static toMarkdown(data: QualityReportData): string {
    const lines: string[] = [];

    lines.push('# Monorepo Code Quality Intelligence Report');
    lines.push('');
    lines.push(`- **Timestamp:** \`${data.timestamp}\``);
    lines.push(`- **Code Quality Score:** **${data.codeQualityScore} / 100** (Grade: **${data.grade}**)`);
    lines.push(`- **Files Analyzed:** ${data.report.totalFiles}`);
    lines.push(`- **Total Lines of Code:** ${data.report.totalLines}`);
    lines.push(`- **Quality Issues Found:** ${data.report.issues.length}`);
    lines.push('');

    lines.push('## Recommendations');
    lines.push('');
    for (const r of data.recommendations) {
      lines.push(`- 💡 ${r}`);
    }
    lines.push('');

    if (data.report.issues.length > 0) {
      lines.push('## Detected Quality Issues');
      lines.push('');
      lines.push('| Category | Severity | File | Message |');
      lines.push('|----------|----------|------|---------|');
      for (const iss of data.report.issues) {
        lines.push(`| \`${iss.category}\` | **${iss.severity.toUpperCase()}** | \`${iss.filePath || 'global'}\` | ${iss.message} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  public static toJSON(data: QualityReportData): string {
    return JSON.stringify(data, null, 2);
  }
}
