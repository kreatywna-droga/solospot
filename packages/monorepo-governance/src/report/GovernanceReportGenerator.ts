import { GovernanceAnalysisResult } from '../analyzer/GovernanceAnalyzer';

export interface GovernanceReportData {
  timestamp: string;
  governanceScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  analysis: GovernanceAnalysisResult;
  recommendations: string[];
}

export class GovernanceReportGenerator {
  public static calculateScore(analysis: GovernanceAnalysisResult): number {
    if (analysis.totalPackagesCount === 0) return 100;
    const ratio = analysis.compliantPackagesCount / analysis.totalPackagesCount;
    let score = Math.round(ratio * 100);

    for (const v of analysis.violations) {
      if (v.severity === 'error') score -= 10;
      else if (v.severity === 'warning') score -= 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  public static getGrade(score: number): GovernanceReportData['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  public static generateReport(analysis: GovernanceAnalysisResult): GovernanceReportData {
    const governanceScore = GovernanceReportGenerator.calculateScore(analysis);
    const grade = GovernanceReportGenerator.getGrade(governanceScore);

    const recommendations: string[] = [];
    if (analysis.violations.some(v => v.severity === 'error')) {
      recommendations.push('Fix package scope naming errors to enforce @web-factor/* scope.');
    }
    if (analysis.violations.some(v => v.severity === 'warning')) {
      recommendations.push('Add missing package.json metadata (types, private flag).');
    }
    if (recommendations.length === 0) {
      recommendations.push('Monorepo packages strictly comply with workspace governance standards.');
    }

    return {
      timestamp: new Date().toISOString(),
      governanceScore,
      grade,
      analysis,
      recommendations,
    };
  }

  public static toMarkdown(data: GovernanceReportData): string {
    const lines: string[] = [];

    lines.push('# Monorepo Governance Analysis Report');
    lines.push('');
    lines.push(`- **Timestamp:** \`${data.timestamp}\``);
    lines.push(`- **Governance Score:** **${data.governanceScore} / 100** (Grade: **${data.grade}**)`);
    lines.push(`- **Compliant Packages:** ${data.analysis.compliantPackagesCount} / ${data.analysis.totalPackagesCount}`);
    lines.push(`- **Total Violations:** ${data.analysis.violations.length}`);
    lines.push('');

    lines.push('## Recommendations');
    lines.push('');
    for (const r of data.recommendations) {
      lines.push(`- 💡 ${r}`);
    }
    lines.push('');

    if (data.analysis.violations.length > 0) {
      lines.push('## Detailed Policy Violations');
      lines.push('');
      lines.push('| Package Path | Severity | Policy ID | Message |');
      lines.push('|--------------|----------|-----------|---------|');
      for (const v of data.analysis.violations) {
        lines.push(`| \`${v.packagePath}\` | **${v.severity.toUpperCase()}** | \`${v.policyId}\` | ${v.message} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  public static toJSON(data: GovernanceReportData): string {
    return JSON.stringify(data, null, 2);
  }
}
