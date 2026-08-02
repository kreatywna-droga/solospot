import { SecurityFinding, SecurityAssessment } from '../model/SecurityModel';
import { SecurityValidator } from '../validator/SecurityValidator';

export interface SecurityReportData {
  timestamp: string;
  platformSecurityScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  assessment: SecurityAssessment;
  findings: SecurityFinding[];
  recommendations: string[];
}

export class SecurityReportGenerator {
  public static calculateSecurityScore(assessment: SecurityAssessment): number {
    let score = 100;
    score -= assessment.criticalCount * 30;
    score -= assessment.highCount * 15;
    score -= assessment.mediumCount * 5;
    score -= assessment.lowCount * 1;
    return Math.max(0, Math.min(100, score));
  }

  public static getGrade(score: number): SecurityReportData['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  public static generateReport(findings: SecurityFinding[]): SecurityReportData {
    const assessment = SecurityValidator.assessFindings(findings);
    const platformSecurityScore = SecurityReportGenerator.calculateSecurityScore(assessment);
    const grade = SecurityReportGenerator.getGrade(platformSecurityScore);

    const recommendations: string[] = [];
    if (assessment.criticalCount > 0) {
      recommendations.push('Eliminate critical eval() dynamic code executions immediately.');
    }
    if (assessment.highCount > 0) {
      recommendations.push('Specify explicit target origins for postMessage() calls to prevent cross-origin leaks.');
    }
    if (assessment.mediumCount > 0) {
      recommendations.push('Replace innerHTML assignments with safe DOM textContent or React bindings.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Platform architecture meets strict security policy standards.');
    }

    return {
      timestamp: new Date().toISOString(),
      platformSecurityScore,
      grade,
      assessment,
      findings,
      recommendations,
    };
  }

  public static toMarkdown(data: SecurityReportData): string {
    const lines: string[] = [];

    lines.push('# Platform Security Intelligence Analysis Report');
    lines.push('');
    lines.push(`- **Timestamp:** \`${data.timestamp}\``);
    lines.push(`- **Platform Security Score:** **${data.platformSecurityScore} / 100** (Grade: **${data.grade}**)`);
    lines.push(`- **Total Security Findings:** ${data.assessment.totalFindings}`);
    lines.push(`- **Critical:** ${data.assessment.criticalCount} | **High:** ${data.assessment.highCount} | **Medium:** ${data.assessment.mediumCount}`);
    lines.push('');

    lines.push('## Security Recommendations');
    lines.push('');
    for (const r of data.recommendations) {
      lines.push(`- 💡 ${r}`);
    }
    lines.push('');

    if (data.findings.length > 0) {
      lines.push('## Detected Security Findings');
      lines.push('');
      lines.push('| Category | Severity | Target Path | Message |');
      lines.push('|----------|----------|-------------|---------|');
      for (const f of data.findings) {
        lines.push(`| \`${f.category}\` | **${f.severity.toUpperCase()}** | \`${f.targetPath || 'global'}\` | ${f.message} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  public static toJSON(data: SecurityReportData): string {
    return JSON.stringify(data, null, 2);
  }
}
