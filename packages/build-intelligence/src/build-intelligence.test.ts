import { describe, it, expect } from 'vitest';
import {
  BuildAnalyzer,
  BuildValidator,
  BuildReportGenerator,
  BuildIntelligenceCLI,
} from './index';

describe('Build Intelligence Platform Unit Tests', () => {
  describe('BuildAnalyzer — TSConfig analysis', () => {
    it('should report no issues for a fully compliant tsconfig', () => {
      const issues = BuildAnalyzer.analyzeTSConfig({
        tsconfigPath: 'packages/foo/tsconfig.json',
        target: 'ES2022',
        strict: true,
        declaration: true,
      });
      expect(issues).toHaveLength(0);
    });

    it('should report warning when strict mode is disabled', () => {
      const issues = BuildAnalyzer.analyzeTSConfig({
        tsconfigPath: 'packages/bar/tsconfig.json',
        strict: false,
        declaration: true,
      });
      expect(issues.some((i) => i.issueType === 'strict_disabled')).toBe(true);
      expect(issues.every((i) => i.severity === 'warning')).toBe(true);
    });

    it('should report warning when declaration is disabled', () => {
      const issues = BuildAnalyzer.analyzeTSConfig({
        tsconfigPath: 'packages/baz/tsconfig.json',
        strict: true,
        declaration: false,
      });
      expect(issues.some((i) => i.issueType === 'declaration_disabled')).toBe(true);
    });

    it('should report both warnings when strict and declaration are both disabled', () => {
      const issues = BuildAnalyzer.analyzeTSConfig({
        tsconfigPath: 'packages/qux/tsconfig.json',
        strict: false,
        declaration: false,
      });
      expect(issues).toHaveLength(2);
    });
  });

  describe('BuildAnalyzer — package.json manifest analysis', () => {
    it('should report no issues for a complete manifest', () => {
      const issues = BuildAnalyzer.analyzePackageManifest('@web-factor/ok', {
        main: './src/index.ts',
        types: './src/index.ts',
      });
      expect(issues).toHaveLength(0);
    });

    it('should report error when main entry is missing', () => {
      const issues = BuildAnalyzer.analyzePackageManifest('@web-factor/no-main', {
        types: './src/index.ts',
      });
      expect(issues.some((i) => i.issueType === 'invalid_main')).toBe(true);
      expect(issues.every((i) => i.severity === 'error')).toBe(true);
    });

    it('should report error when types entry is missing', () => {
      const issues = BuildAnalyzer.analyzePackageManifest('@web-factor/no-types', {
        main: './src/index.ts',
      });
      expect(issues.some((i) => i.issueType === 'missing_types')).toBe(true);
    });
  });

  describe('BuildValidator — assessment', () => {
    it('should correctly count warnings and errors', () => {
      const allIssues = [
        ...BuildAnalyzer.analyzeTSConfig({ tsconfigPath: 't.json', strict: false, declaration: false }),
        ...BuildAnalyzer.analyzePackageManifest('@web-factor/x', {}),
      ];
      const assessment = BuildValidator.assessBuildIssues(allIssues);
      expect(assessment.warningCount).toBe(2);
      expect(assessment.errorCount).toBe(2);
      expect(assessment.totalIssues).toBe(4);
    });

    it('should return zero counts for empty issue list', () => {
      const assessment = BuildValidator.assessBuildIssues([]);
      expect(assessment.totalIssues).toBe(0);
      expect(assessment.warningCount).toBe(0);
      expect(assessment.errorCount).toBe(0);
    });
  });

  describe('BuildReportGenerator', () => {
    it('should return 100 / A+ for a fully clean build', () => {
      const report = BuildReportGenerator.generateReport(
        { totalIssues: 0, warningCount: 0, errorCount: 0 },
        []
      );
      expect(report.buildHealthScore).toBe(100);
      expect(report.grade).toBe('A+');
    });

    it('should penalise errors and warnings correctly', () => {
      const report = BuildReportGenerator.generateReport(
        { totalIssues: 3, warningCount: 1, errorCount: 1 },
        []
      );
      // score = 100 - 15 - 5 = 80
      expect(report.buildHealthScore).toBe(80);
      expect(report.grade).toBe('B');
    });

    it('should generate valid Markdown report', () => {
      const issues = BuildAnalyzer.analyzePackageManifest('@web-factor/test', {});
      const assessment = BuildValidator.assessBuildIssues(issues);
      const report = BuildReportGenerator.generateReport(assessment, issues);
      const md = BuildReportGenerator.toMarkdown(report);
      expect(md).toContain('# Build Intelligence Health Analysis Report');
      expect(md).toContain('invalid_main');
    });

    it('should generate valid JSON report', () => {
      const report = BuildReportGenerator.generateReport(
        { totalIssues: 0, warningCount: 0, errorCount: 0 },
        []
      );
      const json = BuildReportGenerator.toJSON(report);
      expect(json).toContain('"buildHealthScore"');
      expect(json).toContain('"grade"');
    });
  });

  describe('BuildIntelligenceCLI', () => {
    it('should default to help when no args provided', () => {
      const result = BuildIntelligenceCLI.parseArgs([]);
      expect(result.command).toBe('help');
    });

    it('should parse analyze command with target path', () => {
      const result = BuildIntelligenceCLI.parseArgs(['analyze', '--target=packages/foo']);
      expect(result.command).toBe('analyze');
      expect(result.targetPath).toBe('packages/foo');
    });

    it('should parse report command with output path', () => {
      const result = BuildIntelligenceCLI.parseArgs(['report', '--out=dist/report.md']);
      expect(result.command).toBe('report');
      expect(result.outputPath).toBe('dist/report.md');
    });

    it('should include help text with all commands', () => {
      const help = BuildIntelligenceCLI.getHelpText();
      expect(help).toContain('analyze');
      expect(help).toContain('validate');
      expect(help).toContain('report');
    });
  });
});
