import { describe, it, expect } from 'vitest';
import {
  VersionAnalyzer,
  ChangelogAnalyzer,
  ReleaseValidator,
  ReleaseReportGenerator,
  ReleaseManagementCLI,
} from './index';

describe('Release Management Platform Unit Tests', () => {
  it('should validate semver and suggest version bumps', () => {
    expect(VersionAnalyzer.validateSemver('2.0.0')).toBe(true);
    expect(VersionAnalyzer.validateSemver('2.0')).toBe(false);

    expect(VersionAnalyzer.suggestBump('1.0.0', ['Breaking'])).toBe('major');
    expect(VersionAnalyzer.suggestBump('1.0.0', ['Added'])).toBe('minor');
    expect(VersionAnalyzer.suggestBump('1.0.0', ['Fixed'])).toBe('patch');
  });

  it('should parse CHANGELOG markdown into structured categories', () => {
    const sampleChangelog = `
      ## [2.0.0] - 2026-07-30
      ### Added
      - Initial release of Studio Shell
      ### Fixed
      - Resolved layout calculation bug
    `;

    const entries = ChangelogAnalyzer.parseChangelog(sampleChangelog);
    expect(entries.length).toBe(1);
    expect(entries[0].version).toBe('2.0.0');
    expect(entries[0].added.length).toBe(1);
    expect(entries[0].fixed.length).toBe(1);
  });

  it('should validate release readiness and generate reports', () => {
    const pkgInfo = VersionAnalyzer.analyzePackages([{ name: '@web-factor/ui-core', version: '0.1.0' }]);
    const valRes = ReleaseValidator.validateReleaseReadiness('2.0.0', pkgInfo, []);

    expect(valRes.isReady).toBe(true);
    expect(valRes.warnings.length).toBeGreaterThan(0); // missing changelog warning

    const report = ReleaseReportGenerator.generateReport(valRes, 1);
    expect(report.readinessScore).toBe(90);
    expect(report.grade).toBe('A');

    const md = ReleaseReportGenerator.toMarkdown(report);
    expect(md).toContain('# Monorepo Release Readiness Report');
    expect(md).toContain('Target Release Version');

    const json = ReleaseReportGenerator.toJSON(report);
    expect(json).toContain('"readinessScore": 90');
  });

  it('should parse CLI arguments correctly', () => {
    const parseRes = ReleaseManagementCLI.parseArgs(['validate', '--version=2.0.0']);
    expect(parseRes.command).toBe('validate');
    expect(parseRes.versionArg).toBe('2.0.0');

    const help = ReleaseManagementCLI.getHelpText();
    expect(help).toContain('Usage: release-management <command>');
  });
});
