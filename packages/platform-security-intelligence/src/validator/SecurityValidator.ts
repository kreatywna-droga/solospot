import { SecurityFinding, SecurityAssessment } from '../model/SecurityModel';

export class SecurityValidator {
  public static assessFindings(findings: SecurityFinding[]): SecurityAssessment {
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    for (const f of findings) {
      if (f.severity === 'critical') criticalCount++;
      else if (f.severity === 'high') highCount++;
      else if (f.severity === 'medium') mediumCount++;
      else if (f.severity === 'low') lowCount++;
    }

    return {
      totalFindings: findings.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
    };
  }
}
