import { TestArtifact, TestCoverage, TestIssue } from '../model/TestModel';

export class TestValidator {
  public static validateArtifacts(artifacts: TestArtifact[], coverage: TestCoverage): TestIssue[] {
    const issues: TestIssue[] = [];

    for (const art of artifacts) {
      if (art.isEmpty) {
        issues.push({
          id: `tst_empty_${Math.random().toString(36).substring(2, 6)}`,
          issueType: 'empty_test',
          severity: 'warning',
          message: `Test artifact '${art.filePath}' is empty or missing assertions (expect/assert).`,
          targetPath: art.filePath,
        });
      }
    }

    if (coverage.coveragePercentage < 80) {
      issues.push({
        id: `tst_cov_${Math.random().toString(36).substring(2, 6)}`,
        issueType: 'missing_test',
        severity: 'error',
        message: `Static test file coverage (${coverage.coveragePercentage}%) is below 80% DoD requirement.`,
      });
    }

    return issues;
  }
}
