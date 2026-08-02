import { FileQualityReport, ProjectQualityReport, QualityIssue } from '../model/QualityModel';

export class QualityValidator {
  public static calculateQualityScore(issues: QualityIssue[]): number {
    let score = 100;
    for (const iss of issues) {
      if (iss.severity === 'error') score -= 15;
      else if (iss.severity === 'warning') score -= 5;
      else if (iss.severity === 'info') score -= 1;
    }
    return Math.max(0, Math.min(100, score));
  }

  public static validateProject(fileReports: FileQualityReport[]): ProjectQualityReport {
    const allIssues: QualityIssue[] = [];
    let totalLines = 0;

    for (const report of fileReports) {
      totalLines += report.linesCount;
      allIssues.push(...report.issues);
    }

    const qualityScore = QualityValidator.calculateQualityScore(allIssues);

    return {
      timestamp: new Date().toISOString(),
      qualityScore,
      totalFiles: fileReports.length,
      totalLines,
      issues: allIssues,
    };
  }
}
