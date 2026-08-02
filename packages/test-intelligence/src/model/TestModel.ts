export type TestSeverity = 'info' | 'warning' | 'error';
export type TestIssueType = 'missing_test' | 'empty_test' | 'missing_assertions' | 'naming_mismatch';

export interface TestSuite {
  name: string;
  testCount: number;
  hasAssertions: boolean;
}

export interface TestArtifact {
  filePath: string;
  sourceFilePath?: string;
  testSuites: TestSuite[];
  isEmpty: boolean;
}

export interface TestCoverage {
  totalSourceFiles: number;
  testedSourceFiles: number;
  coveragePercentage: number;
}

export interface TestIssue {
  id: string;
  issueType: TestIssueType;
  severity: TestSeverity;
  message: string;
  targetPath?: string;
}

export interface TestAssessment {
  totalIssues: number;
  warningCount: number;
  errorCount: number;
}
