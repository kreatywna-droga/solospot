import { describe, it, expect } from 'vitest';
import {
  SecurityAnalyzer,
  SecurityValidator,
  SecurityReportGenerator,
  SecurityCLI,
  DEFAULT_SECURITY_POLICIES,
} from './index';
import type { SecurityFileSnapshot, SecurityPolicy } from './index';

// ===========================================================================
// Fixture Factories
// ===========================================================================

function makeFile(
  filePath: string,
  content: string,
  packageName = 'builder'
): SecurityFileSnapshot {
  return {
    filePath,
    content,
    extension: filePath.substring(filePath.lastIndexOf('.')),
    packageName,
  };
}

// ===========================================================================
// 1. SecurityAnalyzer — parseFiles & parsePolicies
// ===========================================================================
describe('SecurityAnalyzer — parseFiles & parsePolicies', () => {
  it('converts raw objects into SecurityFileSnapshot objects', () => {
    const files = SecurityAnalyzer.parseFiles([
      { filePath: 'src/config.ts', content: 'export const config = {};' },
    ]);
    expect(files).toHaveLength(1);
    expect(files[0].filePath).toBe('src/config.ts');
    expect(files[0].extension).toBe('.ts');
  });

  it('returns default policies when no policies provided', () => {
    const policies = SecurityAnalyzer.parsePolicies();
    expect(policies).toHaveLength(DEFAULT_SECURITY_POLICIES.length);
    expect(policies[0].policyId).toBe('SEC-POL-001');
  });
});

// ===========================================================================
// 2. SecurityAnalyzer — detectSecrets (potential secrets detection)
// ===========================================================================
describe('SecurityAnalyzer — detectSecrets', () => {
  it('flags hardcoded AWS access keys', () => {
    const file = makeFile('src/aws.ts', 'const key = "AKIAIOSFODNN7EXAMPLE";');
    const findings = SecurityAnalyzer.detectSecrets([file]);
    expect(findings).toHaveLength(1);
    expect(findings[0].category).toBe('hardcoded_secrets');
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].snippet).toContain('AKIA...MPLE');
  });

  it('flags exposed private key headers', () => {
    const file = makeFile('src/crypto.ts', 'const key = "-----BEGIN RSA PRIVATE KEY-----\\\\nMIIE...";');
    const findings = SecurityAnalyzer.detectSecrets([file]);
    expect(findings).toHaveLength(1);
    expect(findings[0].findingType).toBe('private_key_exposed');
    expect(findings[0].severity).toBe('critical');
  });

  it('flags hardcoded API keys', () => {
    const file = makeFile('src/api.ts', 'const apiKey = "api_key = \\"abcdef12345678901234\\";"');
    const findings = SecurityAnalyzer.detectSecrets([file]);
    expect(findings.some((f) => f.findingType === 'api_key_hardcoded')).toBe(true);
  });

  it('skips test files automatically', () => {
    const file = makeFile('src/api.test.ts', 'const key = "AKIAIOSFODNN7EXAMPLE";');
    expect(SecurityAnalyzer.detectSecrets([file])).toHaveLength(0);
  });

  it('returns no findings for clean code', () => {
    const file = makeFile('src/clean.ts', 'const apiKey = process.env.API_KEY;');
    expect(SecurityAnalyzer.detectSecrets([file])).toHaveLength(0);
  });
});

// ===========================================================================
// 3. SecurityAnalyzer — detectUnsafeCodePatterns
// ===========================================================================
describe('SecurityAnalyzer — detectUnsafeCodePatterns', () => {
  it('flags use of eval()', () => {
    const file = makeFile('src/dynamic.ts', 'const res = eval("2 + 2");');
    const findings = SecurityAnalyzer.detectUnsafeCodePatterns([file]);
    expect(findings).toHaveLength(1);
    expect(findings[0].findingType).toBe('unsafe_eval');
    expect(findings[0].severity).toBe('critical');
  });

  it('flags dangerouslySetInnerHTML / innerHTML usage', () => {
    const file = makeFile('src/Component.tsx', '<div dangerouslySetInnerHTML={{ __html: content }} />');
    const findings = SecurityAnalyzer.detectUnsafeCodePatterns([file]);
    expect(findings).toHaveLength(1);
    expect(findings[0].findingType).toBe('inner_html_injection');
    expect(findings[0].severity).toBe('error');
  });

  it('flags Math.random() in token generation context', () => {
    const file = makeFile('src/auth.ts', 'const secretToken = Math.random().toString(36);');
    const findings = SecurityAnalyzer.detectUnsafeCodePatterns([file]);
    expect(findings).toHaveLength(1);
    expect(findings[0].findingType).toBe('insecure_random');
    expect(findings[0].severity).toBe('warning');
  });

  it('returns no findings for clean React code', () => {
    const file = makeFile('src/Component.tsx', 'return <div>{content}</div>;');
    expect(SecurityAnalyzer.detectUnsafeCodePatterns([file])).toHaveLength(0);
  });
});

// ===========================================================================
// 4. SecurityAnalyzer — detectDangerousDependencies
// ===========================================================================
describe('SecurityAnalyzer — detectDangerousDependencies', () => {
  it('flags known dangerous dependency in package.json', () => {
    const file = makeFile(
      'package.json',
      JSON.stringify({ dependencies: { 'event-stream': '3.3.6' } })
    );
    const findings = SecurityAnalyzer.detectDangerousDependencies([file]);
    expect(findings).toHaveLength(1);
    expect(findings[0].findingType).toBe('vulnerable_dependency');
    expect(findings[0].severity).toBe('critical');
  });

  it('returns no findings for safe package.json', () => {
    const file = makeFile(
      'package.json',
      JSON.stringify({ dependencies: { 'react': '^18.0.0', 'typescript': '^5.0.0' } })
    );
    expect(SecurityAnalyzer.detectDangerousDependencies([file])).toHaveLength(0);
  });
});

// ===========================================================================
// 5. SecurityAnalyzer — detectLeastPrivilegeViolations & ConfigurationRisks
// ===========================================================================
describe('SecurityAnalyzer — detectLeastPrivilegeViolations & ConfigurationRisks', () => {
  it('flags wildcard CORS origin "*"', () => {
    const file = makeFile('src/server.ts', 'res.setHeader("Access-Control-Allow-Origin", "*");');
    const findings = SecurityAnalyzer.detectLeastPrivilegeViolations([file]);
    expect(findings).toHaveLength(1);
    expect(findings[0].findingType).toBe('wildcard_cors_origin');
  });

  it('flags disabled SSL verification (rejectUnauthorized: false)', () => {
    const file = makeFile('src/http.ts', 'const agent = new https.Agent({ rejectUnauthorized: false });');
    const findings = SecurityAnalyzer.detectConfigurationRisks([file]);
    expect(findings).toHaveLength(1);
    expect(findings[0].findingType).toBe('disabled_ssl_verification');
    expect(findings[0].severity).toBe('critical');
  });
});

// ===========================================================================
// 6. SecurityAnalyzer — validatePolicyCompliance (security policy compliance)
// ===========================================================================
describe('SecurityAnalyzer — validatePolicyCompliance', () => {
  it('detects broken policy when an enforced rule is violated', () => {
    const file = makeFile('src/aws.ts', 'const key = "AKIAIOSFODNN7EXAMPLE";');
    const findings = SecurityAnalyzer.validatePolicyCompliance([file], DEFAULT_SECURITY_POLICIES);
    expect(findings.some((f) => f.findingType === 'missing_security_policy')).toBe(true);
    expect(findings.some((f) => f.policyId === 'SEC-POL-001')).toBe(true);
  });

  it('returns no policy findings when all policies pass', () => {
    const file = makeFile('src/clean.ts', 'const x = 1;');
    const findings = SecurityAnalyzer.validatePolicyCompliance([file], DEFAULT_SECURITY_POLICIES);
    expect(findings).toHaveLength(0);
  });
});

// ===========================================================================
// 7. SecurityValidator — assessFindings & threat classification
// ===========================================================================
describe('SecurityValidator — assessFindings', () => {
  it('returns zero counts for clean scan', () => {
    const assessment = SecurityValidator.assessFindings([], DEFAULT_SECURITY_POLICIES);
    expect(assessment.totalFindings).toBe(0);
    expect(assessment.criticalCount).toBe(0);
    expect(assessment.policyPassRate).toBe(1.0);
  });

  it('correctly classifies findings by category, type, and severity', () => {
    const file = makeFile('src/aws.ts', 'const key = "AKIAIOSFODNN7EXAMPLE";');
    const findings = SecurityAnalyzer.detectSecrets([file]);
    const assessment = SecurityValidator.assessFindings(findings, DEFAULT_SECURITY_POLICIES);

    expect(assessment.criticalCount).toBe(1);
    expect(assessment.byCategory['hardcoded_secrets']).toBeDefined();
    expect(assessment.byType['secret_detected']).toBeDefined();
    expect(assessment.policyPassRate).toBeLessThan(1.0);
  });
});

// ===========================================================================
// 8. SecurityValidator — validateLimits & prioritiseRecommendations
// ===========================================================================
describe('SecurityValidator — validateLimits & prioritiseRecommendations', () => {
  it('passes all metrics for clean findings', () => {
    const metrics = SecurityValidator.validateLimits([], DEFAULT_SECURITY_POLICIES);
    expect(metrics.every((m) => m.passing)).toBe(true);
  });

  it('fails hardcodedSecretCount when secrets exist', () => {
    const file = makeFile('src/aws.ts', 'const key = "AKIAIOSFODNN7EXAMPLE";');
    const findings = SecurityAnalyzer.detectSecrets([file]);
    const metrics = SecurityValidator.validateLimits(findings, DEFAULT_SECURITY_POLICIES);
    expect(metrics.find((m) => m.metricName === 'hardcodedSecretCount')?.passing).toBe(false);
  });

  it('prioritises hardcoded secret recommendations at priority 1', () => {
    const file = makeFile('src/aws.ts', 'const key = "AKIAIOSFODNN7EXAMPLE";');
    const findings = SecurityAnalyzer.detectSecrets([file]);
    const recs = SecurityValidator.prioritiseRecommendations(findings);
    expect(recs[0].priority).toBe(1);
    expect(recs[0].category).toBe('hardcoded_secrets');
    expect(recs[0].estimatedImpact).toBe('high');
  });
});

// ===========================================================================
// 9. SecurityReportGenerator
// ===========================================================================
describe('SecurityReportGenerator — calculateScore & deriveGrade', () => {
  it('returns 100 and A+ for clean assessment', () => {
    const assessment = SecurityValidator.assessFindings([], DEFAULT_SECURITY_POLICIES);
    const score = SecurityReportGenerator.calculateScore(assessment);
    expect(score).toBe(100);
    expect(SecurityReportGenerator.deriveGrade(score)).toBe('A+');
  });

  it('penalises critical findings (25 pts each)', () => {
    const assessment = SecurityValidator.assessFindings([], DEFAULT_SECURITY_POLICIES);
    assessment.criticalCount = 2;
    const score = SecurityReportGenerator.calculateScore(assessment);
    expect(score).toBe(50);
    expect(SecurityReportGenerator.deriveGrade(score)).toBe('D');
  });

  it('never drops below 0 and grades F for score < 50', () => {
    const assessment = SecurityValidator.assessFindings([], DEFAULT_SECURITY_POLICIES);
    assessment.criticalCount = 10;
    const score = SecurityReportGenerator.calculateScore(assessment);
    expect(score).toBe(0);
    expect(SecurityReportGenerator.deriveGrade(score)).toBe('F');
  });
});

describe('SecurityReportGenerator — generateReport & exports', () => {
  it('generates a full SecurityReport', () => {
    const file = makeFile('src/clean.ts', 'const a = 1;');
    const assessment = SecurityValidator.assessFindings([], DEFAULT_SECURITY_POLICIES);
    const report = SecurityReportGenerator.generateReport(assessment, [], [file], DEFAULT_SECURITY_POLICIES);

    expect(report.securityHealthScore).toBe(100);
    expect(report.grade).toBe('A+');
    expect(report.scannedFileCount).toBe(1);
    expect(report.policyCount).toBe(DEFAULT_SECURITY_POLICIES.length);
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('exports valid Markdown', () => {
    const assessment = SecurityValidator.assessFindings([], DEFAULT_SECURITY_POLICIES);
    const report = SecurityReportGenerator.generateReport(assessment, [], [], DEFAULT_SECURITY_POLICIES);
    const md = SecurityReportGenerator.toMarkdown(report);
    expect(md).toContain('# Security Intelligence Health Report');
    expect(md).toContain('Security Health Score');
  });

  it('exports valid JSON', () => {
    const assessment = SecurityValidator.assessFindings([], DEFAULT_SECURITY_POLICIES);
    const report = SecurityReportGenerator.generateReport(assessment, [], [], DEFAULT_SECURITY_POLICIES);
    const json = SecurityReportGenerator.toJSON(report);
    expect(json).toContain('"securityHealthScore"');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ===========================================================================
// 10. SecurityCLI
// ===========================================================================
describe('SecurityCLI', () => {
  it('defaults to help with no args', () => {
    expect(SecurityCLI.parseArgs([]).command).toBe('help');
  });

  it('parses analyze', () => {
    expect(SecurityCLI.parseArgs(['analyze']).command).toBe('analyze');
  });

  it('parses validate', () => {
    expect(SecurityCLI.parseArgs(['validate']).command).toBe('validate');
  });

  it('parses report', () => {
    expect(SecurityCLI.parseArgs(['report']).command).toBe('report');
  });

  it('parses options --target, --out, --format', () => {
    const res = SecurityCLI.parseArgs(['report', '--target=src', '--format=json', '--out=sec.json']);
    expect(res.targetPath).toBe('src');
    expect(res.format).toBe('json');
    expect(res.outputPath).toBe('sec.json');
  });

  it('help text contains commands and flags', () => {
    const help = SecurityCLI.getHelpText();
    expect(help).toContain('analyze');
    expect(help).toContain('validate');
    expect(help).toContain('report');
    expect(help).toContain('--target');
    expect(help).toContain('--format');
    expect(help).toContain('--out');
  });
});

// ===========================================================================
// 11. analyzeAll — integration smoke test
// ===========================================================================
describe('SecurityAnalyzer — analyzeAll integration', () => {
  it('returns no critical findings for clean files', () => {
    const files = [makeFile('src/index.ts', 'export const main = () => console.log("hello");')];
    const findings = SecurityAnalyzer.analyzeAll(files, DEFAULT_SECURITY_POLICIES);
    expect(findings.filter((f) => f.severity === 'critical')).toHaveLength(0);
  });

  it('returns combined findings across passes for insecure files', () => {
    const file = makeFile(
      'src/bad.ts',
      'const aws = "AKIAIOSFODNN7EXAMPLE"; eval("doBad()"); res.setHeader("Access-Control-Allow-Origin", "*");'
    );
    const findings = SecurityAnalyzer.analyzeAll([file], DEFAULT_SECURITY_POLICIES);
    const types = new Set(findings.map((f) => f.findingType));
    expect(types.size).toBeGreaterThan(1);
  });
});
