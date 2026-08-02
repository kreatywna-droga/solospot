import { describe, it, expect } from 'vitest';
import {
  SecurityAnalyzer,
  SecurityValidator,
  SecurityReportGenerator,
  PlatformSecurityCLI,
  DEFAULT_SECURITY_POLICY,
} from './index';

describe('Platform Security Intelligence Unit Tests', () => {
  const sampleInsecureCode = `
    function processInput(val: string) {
      eval(val);
      window.postMessage('*');
      document.getElementById('app')!.innerHTML = val;
    }
  `;

  it('should analyze code exposure and detect eval, wildcard postMessage & innerHTML', () => {
    const findings = SecurityAnalyzer.analyzeCodeExposure('src/Insecure.ts', sampleInsecureCode);
    expect(findings.length).toBe(3);
    expect(findings.some(f => f.severity === 'critical')).toBe(true);
    expect(findings.some(f => f.severity === 'high')).toBe(true);
  });

  it('should assess findings and calculate Platform Security Score', () => {
    const findings = SecurityAnalyzer.analyzeCodeExposure('src/Insecure.ts', sampleInsecureCode);
    const assessment = SecurityValidator.assessFindings(findings);

    expect(assessment.totalFindings).toBe(3);
    expect(assessment.criticalCount).toBe(1);

    const report = SecurityReportGenerator.generateReport(findings);
    expect(report.platformSecurityScore).toBeLessThan(100);
    expect(report.grade).toBeDefined();

    const md = SecurityReportGenerator.toMarkdown(report);
    expect(md).toContain('# Platform Security Intelligence Analysis Report');
    expect(md).toContain('Critical');

    const json = SecurityReportGenerator.toJSON(report);
    expect(json).toContain('"platformSecurityScore"');
  });

  it('should inspect default security policy', () => {
    expect(DEFAULT_SECURITY_POLICY.id).toBe('policy_platform_strict');
    expect(DEFAULT_SECURITY_POLICY.requireIframeIsolation).toBe(true);
  });

  it('should parse CLI arguments correctly', () => {
    const parseRes = PlatformSecurityCLI.parseArgs(['validate', '--target=src/lib']);
    expect(parseRes.command).toBe('validate');
    expect(parseRes.targetPath).toBe('src/lib');

    const help = PlatformSecurityCLI.getHelpText();
    expect(help).toContain('Usage: platform-security <command>');
  });
});
