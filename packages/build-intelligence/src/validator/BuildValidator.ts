import { BuildIssue, BuildAssessment } from '../model/BuildModel';

export class BuildValidator {
  public static assessBuildIssues(issues: BuildIssue[]): BuildAssessment {
    let warningCount = 0;
    let errorCount = 0;

    for (const iss of issues) {
      if (iss.severity === 'error') errorCount++;
      else if (iss.severity === 'warning') warningCount++;
    }

    return {
      totalIssues: issues.length,
      warningCount,
      errorCount,
    };
  }
}
