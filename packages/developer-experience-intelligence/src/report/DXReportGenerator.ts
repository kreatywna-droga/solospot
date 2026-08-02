import { DXIssue, DXAssessment, DXRecommendation } from '../model/DXModel';
import { DXValidator } from '../validator/DXValidator';

export interface DXReportData {
  timestamp: string;
  developerExperienceScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  assessment: DXAssessment;
  issues: DXIssue[];
  recommendations: DXRecommendation[];
}

export class DXReportGenerator {
  public static calculateDXScore(assessment: DXAssessment): number {
    let score = 100;
    score -= assessment.errorCount * 15;
    score -= assessment.warningCount * 5;
    return Math.max(0, Math.min(100, score));
  }

  public static getGrade(score: number): DXReportData['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  public static generateReport(issues: DXIssue[]): DXReportData {
    const assessment = DXValidator.assessDX(issues);
    const developerExperienceScore = DXReportGenerator.calculateDXScore(assessment);
    const grade = DXReportGenerator.getGrade(developerExperienceScore);

    const recommendations: DXRecommendation[] = [];
    if (assessment.errorCount > 0) {
      recommendations.push({
        title: 'Fix Empty Public API Exports',
        description: 'Re-export all public domain modules via src/index.ts in affected packages.',
        priority: 'high',
      });
    }
    if (assessment.warningCount > 0) {
      recommendations.push({
        title: 'Standardize Naming Casing',
        description: 'Ensure classes/interfaces use PascalCase and helpers use camelCase.',
        priority: 'medium',
      });
    }
    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Maintain Ergonomic Standards',
        description: 'Developer Experience and API ergonomics meet top-tier monorepo standards.',
        priority: 'low',
      });
    }

    return {
      timestamp: new Date().toISOString(),
      developerExperienceScore,
      grade,
      assessment,
      issues,
      recommendations,
    };
  }

  public static toMarkdown(data: DXReportData): string {
    const lines: string[] = [];

    lines.push('# Developer Experience (DX) Intelligence Report');
    lines.push('');
    lines.push(`- **Timestamp:** \`${data.timestamp}\``);
    lines.push(`- **Developer Experience Score:** **${data.developerExperienceScore} / 100** (Grade: **${data.grade}**)`);
    lines.push(`- **Total DX Issues:** ${data.assessment.totalIssues}`);
    lines.push(`- **Errors:** ${data.assessment.errorCount} | **Warnings:** ${data.assessment.warningCount}`);
    lines.push('');

    lines.push('## Recommendations');
    lines.push('');
    for (const r of data.recommendations) {
      lines.push(`- 💡 **[${r.priority.toUpperCase()}] ${r.title}:** ${r.description}`);
    }
    lines.push('');

    if (data.issues.length > 0) {
      lines.push('## Detected DX Ergonomic Issues');
      lines.push('');
      lines.push('| Category | Severity | Target Path | Message |');
      lines.push('|----------|----------|-------------|---------|');
      for (const iss of data.issues) {
        lines.push(`| \`${iss.category}\` | **${iss.severity.toUpperCase()}** | \`${iss.targetPath || 'global'}\` | ${iss.message} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  public static toJSON(data: DXReportData): string {
    return JSON.stringify(data, null, 2);
  }
}
