// Test Model API
export type {
  TestSeverity,
  TestIssueType,
  TestSuite,
  TestArtifact,
  TestCoverage,
  TestIssue,
  TestAssessment,
} from './model/TestModel';

// Test Analyzer API
export { TestAnalyzer } from './analyzer/TestAnalyzer';

// Test Validator API
export { TestValidator } from './validator/TestValidator';

// Report Generator API
export { TestReportGenerator } from './report/TestReportGenerator';
export type { TestReportData } from './report/TestReportGenerator';

// CLI API
export { TestIntelligenceCLI } from './cli/TestIntelligenceCLI';
export type { TestCLICommand, TestCLIParseResult } from './cli/TestIntelligenceCLI';
