import { describe, it, expect } from 'vitest';
import {
  TestAnalyzer,
  TestValidator,
  TestReportGenerator,
  TestIntelligenceCLI,
} from './index';

describe('Test Intelligence Platform Unit Tests', () => {
  const sampleTestCode = `
    import { describe, it, expect } from 'vitest';
    describe('Sample Suite', () => {
      it('should pass test', () => {
        expect(1 + 1).toBe(2);
      });
    });
  `;

  const emptyTestCode = `
    describe('Empty Suite', () => {
      it('todo test', () => {});
    });
  `;

  it('should analyze test files and detect assertions vs empty tests', () => {
    const artClean = TestAnalyzer.analyzeTestFile('src/Sample.test.ts', sampleTestCode);
    expect(artClean.isEmpty).toBe(false);
    expect(artClean.testSuites.length).toBe(2); // describe + it

    const artEmpty = TestAnalyzer.analyzeTestFile('src/Empty.test.ts', emptyTestCode);
    expect(artEmpty.isEmpty).toBe(true);
  });

  it('should calculate static coverage between source and test files', () => {
    const sourceFiles = ['src/User.ts', 'src/Order.ts'];
    const testFiles = ['src/User.test.ts'];

    const coverage = TestAnalyzer.calculateStaticCoverage(sourceFiles, testFiles);
    expect(coverage.totalSourceFiles).toBe(2);
    expect(coverage.testedSourceFiles).toBe(1);
    expect(coverage.coveragePercentage).toBe(50);
  });

  it('should validate test artifacts and generate Test Quality Score report', () => {
    const artEmpty = TestAnalyzer.analyzeTestFile('src/Empty.test.ts', emptyTestCode);
    const coverage = { totalSourceFiles: 2, testedSourceFiles: 2, coveragePercentage: 100 };

    const issues = TestValidator.validateArtifacts([artEmpty], coverage);
    expect(issues.length).toBe(1);
    expect(issues[0].issueType).toBe('empty_test');

    const report = TestReportGenerator.generateReport(coverage, issues);
    expect(report.testQualityScore).toBe(95);
    expect(report.grade).toBe('A+');

    const md = TestReportGenerator.toMarkdown(report);
    expect(md).toContain('# Test Intelligence Quality Analysis Report');
    expect(md).toContain('empty_test');

    const json = TestReportGenerator.toJSON(report);
    expect(json).toContain('"testQualityScore": 95');
  });

  it('should parse CLI arguments correctly', () => {
    const parseRes = TestIntelligenceCLI.parseArgs(['validate', '--target=src']);
    expect(parseRes.command).toBe('validate');
    expect(parseRes.targetPath).toBe('src');

    const help = TestIntelligenceCLI.getHelpText();
    expect(help).toContain('Usage: test-intelligence <command>');
  });
});
