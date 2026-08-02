import { TestCoverage, TestIssue } from '../model/TestModel';

export interface TestReportData {
  timestamp: string;
  testQualityScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  coverage: TestCoverage;
  issues: TestIssue[];
  recommendations: string[];
}

export class TestReportGenerator {
  public static calculateScore(coverage: TestCoverage, issues: TestIssue[]): number {
    let score = coverage.coveragePercentage;
    for (const iss of issues) {
      if (iss.severity === 'error') score -= 15;
      else if (iss.severity === 'warning') score -= 5;
    }
    return Math.max(0, Math.min(100, score));
  }

  public static getGrade(score: number): TestReportData['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  public static generateReport(coverage: TestCoverage, issues: TestIssue[]): TestReportData {
    const testQualityScore = TestReportGenerator.calculateScore(coverage, issues);
    const grade = TestReportGenerator.getGrade(testQualityScore);

    const recommendations: string[] = [];
    if (coverage.coveragePercentage < 80) {
      recommendations.push(`Increase static test file coverage from ${coverage.coveragePercentage}% to at least 80%.`);
    }
    if (issues.some(i => i.issueType === 'empty_test')) {
      recommendations.push('Add assertions (expect/assert) to stubbed test artifacts.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Test suite quality and static module coverage meet DoD standards.');
    }

    return {
      timestamp: new Date().toISOString(),
      testQualityScore,
      grade,
      coverage,
      issues,
      recommendations,
    };
  }

  public static toMarkdown(data: TestReportData): string {
    const lines: string[] = [];

    lines.push('# Test Intelligence Quality Analysis Report');
    lines.push('');
    lines.push(`- **Timestamp:** \`${data.timestamp}\``);
    lines.push(`- **Test Quality Score:** **${data.testQualityScore} / 100** (Grade: **${data.grade}**)`);
    lines.push(`- **Static Coverage:** ${data.coverage.testedSourceFiles} / ${data.coverage.totalSourceFiles} modules (${data.coverage.coveragePercentage}%)`);
    lines.push(`- **Total Test Issues Found:** ${data.issues.length}`);
    lines.push('');

    lines.push('## Recommendations');
    lines.push('');
    for (const r of data.recommendations) {
      lines.push(`- 💡 ${r}`);
    }
    lines.push('');

    if (data.issues.length > 0) {
      lines.push('## Detected Test Issues');
      lines.push('');
      lines.push('| Issue Type | Severity | Target Path | Message |');
      lines.push('|------------|----------|-------------|---------|');
      for (const iss of data.issues) {
        lines.push(`| \`${iss.issueType}\` | **${iss.severity.toUpperCase()}** | \`${iss.targetPath || 'suite'}\` | ${iss.message} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  public static toJSON(data: TestReportData): string {
    return JSON.stringify(data, null, 2);
  }
}
