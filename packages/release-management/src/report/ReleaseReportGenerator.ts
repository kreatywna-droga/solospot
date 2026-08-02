import { ReleaseValidationResult } from '../validator/ReleaseValidator';
import { PackageVersionInfo } from '../version/VersionAnalyzer';

export interface ReleaseReportData {
  timestamp: string;
  readinessScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  validation: ReleaseValidationResult;
  packagesCount: number;
  recommendations: string[];
}

export class ReleaseReportGenerator {
  public static calculateScore(validation: ReleaseValidationResult): number {
    let score = 100;
    for (const _err of validation.errors) score -= 25;
    for (const _warn of validation.warnings) score -= 10;
    return Math.max(0, Math.min(100, score));
  }

  public static getGrade(score: number): ReleaseReportData['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  public static generateReport(
    validation: ReleaseValidationResult,
    packagesCount: number
  ): ReleaseReportData {
    const readinessScore = ReleaseReportGenerator.calculateScore(validation);
    const grade = ReleaseReportGenerator.getGrade(readinessScore);

    const recommendations: string[] = [];
    if (validation.errors.length > 0) {
      recommendations.push('Fix invalid SemVer version strings before releasing.');
    }
    if (validation.warnings.length > 0) {
      recommendations.push('Ensure target release version has a complete CHANGELOG entry.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Release is 100% validated and ready for deployment.');
    }

    return {
      timestamp: new Date().toISOString(),
      readinessScore,
      grade,
      validation,
      packagesCount,
      recommendations,
    };
  }

  public static toMarkdown(data: ReleaseReportData): string {
    const lines: string[] = [];

    lines.push('# Monorepo Release Readiness Report');
    lines.push('');
    lines.push(`- **Target Release Version:** \`${data.validation.targetVersion}\``);
    lines.push(`- **Timestamp:** \`${data.timestamp}\``);
    lines.push(`- **Readiness Score:** **${data.readinessScore} / 100** (Grade: **${data.grade}**)`);
    lines.push(`- **Release Status:** ${data.validation.isReady ? 'READY FOR RELEASE ✅' : 'NOT READY ❌'}`);
    lines.push(`- **Total Packages Analyzed:** ${data.packagesCount}`);
    lines.push('');

    lines.push('## Recommendations');
    lines.push('');
    for (const r of data.recommendations) {
      lines.push(`- 💡 ${r}`);
    }
    lines.push('');

    if (data.validation.errors.length > 0) {
      lines.push('## Critical Release Errors');
      lines.push('');
      for (const err of data.validation.errors) {
        lines.push(`- ❌ ${err}`);
      }
      lines.push('');
    }

    if (data.validation.warnings.length > 0) {
      lines.push('## Release Warnings');
      lines.push('');
      for (const w of data.validation.warnings) {
        lines.push(`- ⚠️ ${w}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  public static toJSON(data: ReleaseReportData): string {
    return JSON.stringify(data, null, 2);
  }
}
