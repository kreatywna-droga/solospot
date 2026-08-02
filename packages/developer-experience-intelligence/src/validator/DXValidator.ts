import { DXIssue, DXAssessment } from '../model/DXModel';

export class DXValidator {
  public static assessDX(issues: DXIssue[]): DXAssessment {
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
