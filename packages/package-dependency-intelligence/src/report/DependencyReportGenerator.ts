import { DependencyGraph, DependencyIssue } from '../model/PkgDepModel';
import { DependencyValidator } from '../validator/DependencyValidator';

export interface DependencyReportData {
  timestamp: string;
  dependencyHealthScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  totalPackages: number;
  totalEdges: number;
  issues: DependencyIssue[];
  recommendations: string[];
}

export class DependencyReportGenerator {
  public static calculateHealthScore(issues: DependencyIssue[]): number {
    let score = 100;
    for (const iss of issues) {
      if (iss.severity === 'critical') score -= 30;
      else if (iss.severity === 'error') score -= 15;
      else if (iss.severity === 'warning') score -= 5;
    }
    return Math.max(0, Math.min(100, score));
  }

  public static getGrade(score: number): DependencyReportData['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  public static generateReport(graph: DependencyGraph): DependencyReportData {
    const issues = DependencyValidator.validateGraph(graph);
    const dependencyHealthScore = DependencyReportGenerator.calculateHealthScore(issues);
    const grade = DependencyReportGenerator.getGrade(dependencyHealthScore);

    const recommendations: string[] = [];
    if (issues.some(i => i.issueType === 'cycle')) {
      recommendations.push('Refactor circular package imports into a shared interface or common package.');
    }
    if (issues.some(i => i.issueType === 'high_coupling')) {
      recommendations.push('Decouple highly connected packages by extracting granular sub-packages.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Package dependency topology is clean, acylic and optimal.');
    }

    return {
      timestamp: new Date().toISOString(),
      dependencyHealthScore,
      grade,
      totalPackages: graph.nodes.size,
      totalEdges: graph.dependencies.length,
      issues,
      recommendations,
    };
  }

  public static toMarkdown(data: DependencyReportData): string {
    const lines: string[] = [];

    lines.push('# Package Dependency Intelligence Analysis Report');
    lines.push('');
    lines.push(`- **Timestamp:** \`${data.timestamp}\``);
    lines.push(`- **Dependency Health Score:** **${data.dependencyHealthScore} / 100** (Grade: **${data.grade}**)`);
    lines.push(`- **Total Monorepo Packages:** ${data.totalPackages}`);
    lines.push(`- **Total Dependency Edges:** ${data.totalEdges}`);
    lines.push(`- **Dependency Issues Found:** ${data.issues.length}`);
    lines.push('');

    lines.push('## Recommendations');
    lines.push('');
    for (const r of data.recommendations) {
      lines.push(`- 💡 ${r}`);
    }
    lines.push('');

    if (data.issues.length > 0) {
      lines.push('## Detected Dependency Issues');
      lines.push('');
      lines.push('| Type | Severity | Target Package | Message |');
      lines.push('|------|----------|----------------|---------|');
      for (const iss of data.issues) {
        lines.push(`| \`${iss.issueType}\` | **${iss.severity.toUpperCase()}** | \`${iss.packageName || 'graph'}\` | ${iss.message} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  public static toJSON(data: DependencyReportData): string {
    return JSON.stringify(data, null, 2);
  }
}
