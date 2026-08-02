import { CompatibilityValidationResult } from '../validator/CompatibilityValidator';

export interface ContractReportData {
  timestamp: string;
  compatibilityScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  validation: CompatibilityValidationResult;
  recommendations: string[];
}

export class ContractReportGenerator {
  public static calculateScore(validation: CompatibilityValidationResult): number {
    let score = 100;
    for (const _err of validation.errors) score -= 30;
    for (const _warn of validation.warnings) score -= 10;
    return Math.max(0, Math.min(100, score));
  }

  public static getGrade(score: number): ContractReportData['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  public static generateReport(validation: CompatibilityValidationResult): ContractReportData {
    const compatibilityScore = ContractReportGenerator.calculateScore(validation);
    const grade = ContractReportGenerator.getGrade(compatibilityScore);

    const recommendations: string[] = [];
    if (validation.breakingChanges.length > 0) {
      recommendations.push(`Increment major SemVer version due to ${validation.breakingChanges.length} breaking changes.`);
    }
    if (validation.errors.length > 0) {
      recommendations.push('Restore removed properties or methods to preserve backward compatibility.');
    }
    if (recommendations.length === 0) {
      recommendations.push('API Contract is 100% backward compatible.');
    }

    return {
      timestamp: new Date().toISOString(),
      compatibilityScore,
      grade,
      validation,
      recommendations,
    };
  }

  public static toMarkdown(data: ContractReportData): string {
    const lines: string[] = [];

    lines.push('# API Contract Intelligence Report');
    lines.push('');
    lines.push(`- **Timestamp:** \`${data.timestamp}\``);
    lines.push(`- **Compatibility Score:** **${data.compatibilityScore} / 100** (Grade: **${data.grade}**)`);
    lines.push(`- **Backward Compatible:** ${data.validation.isCompatible ? 'COMPATIBLE ✅' : 'INCOMPATIBLE ❌'}`);
    lines.push(`- **Breaking Changes:** ${data.validation.breakingChanges.length}`);
    lines.push('');

    lines.push('## Recommendations');
    lines.push('');
    for (const r of data.recommendations) {
      lines.push(`- 💡 ${r}`);
    }
    lines.push('');

    if (data.validation.breakingChanges.length > 0) {
      lines.push('## Breaking Changes List');
      lines.push('');
      lines.push('| Interface | Type | Severity | Description |');
      lines.push('|-----------|------|----------|-------------|');
      for (const bc of data.validation.breakingChanges) {
        lines.push(`| \`${bc.interfaceName}\` | \`${bc.type}\` | **${bc.severity.toUpperCase()}** | ${bc.description} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  public static toJSON(data: ContractReportData): string {
    return JSON.stringify(data, null, 2);
  }
}
