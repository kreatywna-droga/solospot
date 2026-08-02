import { describe, it, expect } from 'vitest';
import {
  ConfigurationAnalyzer,
  ConfigurationValidator,
  ConfigurationReportGenerator,
  ConfigurationIntelligenceCLI,
} from './index';
import type { ConfigurationArtifact } from './index';

// ===========================================================================
// Fixture Factories
// ===========================================================================

function makeTSConfig(
  packageName: string,
  overrides: Record<string, unknown> = {},
  exists = true
): ConfigurationArtifact {
  return {
    filePath: `packages/${packageName}/tsconfig.json`,
    packageName,
    toolType: 'tsconfig',
    exists,
    settings: {
      compilerOptions: {
        target: 'ES2022',
        strict: true,
        declaration: true,
        moduleResolution: 'bundler',
        ...overrides,
      },
    },
  };
}

function makePackageJson(
  packageName: string,
  overrides: Record<string, unknown> = {},
  exists = true
): ConfigurationArtifact {
  return {
    filePath: `packages/${packageName}/package.json`,
    packageName,
    toolType: 'package_json',
    exists,
    settings: {
      name: `@web-factor/${packageName}`,
      version: '0.1.0',
      main: './src/index.ts',
      types: './src/index.ts',
      scripts: { test: 'vitest run' },
      ...overrides,
    },
  };
}

function makeESLintConfig(
  packageName: string,
  rules: Record<string, unknown> = {},
  exists = true
): ConfigurationArtifact {
  return {
    filePath: packageName ? `packages/${packageName}/.eslintrc.json` : '.eslintrc.json',
    packageName,
    toolType: 'eslint',
    exists,
    settings: { rules },
  };
}

function makePrettierConfig(
  packageName: string,
  settings: Record<string, unknown> = {},
  exists = true
): ConfigurationArtifact {
  return {
    filePath: packageName ? `packages/${packageName}/.prettierrc` : '.prettierrc',
    packageName,
    toolType: 'prettier',
    exists,
    settings: { printWidth: 100, singleQuote: true, ...settings },
  };
}

function makeVitestConfig(
  packageName: string,
  settings: Record<string, unknown> = {},
  exists = true
): ConfigurationArtifact {
  return {
    filePath: packageName ? `packages/${packageName}/vitest.config.ts` : 'vitest.config.ts',
    packageName,
    toolType: 'vitest',
    exists,
    settings: { test: { globals: true, environment: 'node', ...settings } },
  };
}

// ===========================================================================
// 1. ConfigurationAnalyzer — parseArtifacts
// ===========================================================================
describe('ConfigurationAnalyzer — parseArtifacts', () => {
  it('converts raw entries into ConfigurationArtifact objects', () => {
    const artifacts = ConfigurationAnalyzer.parseArtifacts([
      { filePath: 'tsconfig.json', packageName: '', toolType: 'tsconfig', settings: {}, exists: true },
    ]);
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].toolType).toBe('tsconfig');
    expect(artifacts[0].exists).toBe(true);
  });

  it('defaults exists to true when not provided', () => {
    const artifacts = ConfigurationAnalyzer.parseArtifacts([
      { filePath: 'x.json', packageName: '', toolType: 'other', settings: {} },
    ]);
    expect(artifacts[0].exists).toBe(true);
  });
});

// ===========================================================================
// 2. ConfigurationAnalyzer — detectMissingConfigs (missing file detection)
// ===========================================================================
describe('ConfigurationAnalyzer — detectMissingConfigs', () => {
  it('emits an error for a missing tsconfig', () => {
    const artifact = makeTSConfig('alpha', {}, false);
    const issues = ConfigurationAnalyzer.detectMissingConfigs([artifact]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('missing_tsconfig');
    expect(issues[0].severity).toBe('error');
  });

  it('emits an error for a missing package.json', () => {
    const artifact = makePackageJson('beta', {}, false);
    const issues = ConfigurationAnalyzer.detectMissingConfigs([artifact]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('missing_package_json');
  });

  it('emits an error for a missing ESLint config', () => {
    const artifact = makeESLintConfig('gamma', {}, false);
    const issues = ConfigurationAnalyzer.detectMissingConfigs([artifact]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('missing_eslint_config');
  });

  it('emits errors for multiple missing files', () => {
    const artifacts = [
      makeTSConfig('alpha', {}, false),
      makePackageJson('alpha', {}, false),
    ];
    const issues = ConfigurationAnalyzer.detectMissingConfigs(artifacts);
    expect(issues).toHaveLength(2);
    expect(issues.every((i) => i.severity === 'error')).toBe(true);
  });

  it('returns no issues when all files exist', () => {
    const artifacts = [makeTSConfig('alpha'), makePackageJson('alpha')];
    expect(ConfigurationAnalyzer.detectMissingConfigs(artifacts)).toHaveLength(0);
  });
});

// ===========================================================================
// 3. ConfigurationAnalyzer — TSConfig analysis
// ===========================================================================
describe('ConfigurationAnalyzer — analyzeTSConfigs', () => {
  it('returns no issues for a fully compliant tsconfig', () => {
    const issues = ConfigurationAnalyzer.analyzeTSConfigs([makeTSConfig('alpha')]);
    expect(issues).toHaveLength(0);
  });

  it('flags strict_mode_disabled when strict is false', () => {
    const artifact = makeTSConfig('alpha', { strict: false });
    const issues = ConfigurationAnalyzer.analyzeTSConfigs([artifact]);
    expect(issues.some((i) => i.issueType === 'strict_mode_disabled')).toBe(true);
    expect(issues.every((i) => i.severity === 'warning')).toBe(true);
  });

  it('flags declaration_disabled when declaration is false', () => {
    const artifact = makeTSConfig('alpha', { declaration: false });
    const issues = ConfigurationAnalyzer.analyzeTSConfigs([artifact]);
    expect(issues.some((i) => i.issueType === 'declaration_disabled')).toBe(true);
  });

  it('flags incompatible_target for outdated targets', () => {
    const artifact = makeTSConfig('alpha', { target: 'ES5' });
    const issues = ConfigurationAnalyzer.analyzeTSConfigs([artifact]);
    expect(issues.some((i) => i.issueType === 'incompatible_target')).toBe(true);
  });

  it('does not flag modern targets like ESNext', () => {
    const artifact = makeTSConfig('alpha', { target: 'ESNext' });
    const issues = ConfigurationAnalyzer.analyzeTSConfigs([artifact]);
    expect(issues.some((i) => i.issueType === 'incompatible_target')).toBe(false);
  });

  it('skips non-existent tsconfig files', () => {
    const artifact = makeTSConfig('alpha', { strict: false }, false);
    const issues = ConfigurationAnalyzer.analyzeTSConfigs([artifact]);
    expect(issues).toHaveLength(0);
  });
});

// ===========================================================================
// 4. ConfigurationAnalyzer — Package.json analysis
// ===========================================================================
describe('ConfigurationAnalyzer — analyzePackageJsons', () => {
  it('returns no issues for a fully compliant package.json', () => {
    const issues = ConfigurationAnalyzer.analyzePackageJsons([makePackageJson('alpha')]);
    expect(issues).toHaveLength(0);
  });

  it('flags missing_main_entry when main is absent', () => {
    const artifact = makePackageJson('alpha', { main: undefined });
    const issues = ConfigurationAnalyzer.analyzePackageJsons([artifact]);
    expect(issues.some((i) => i.issueType === 'missing_main_entry')).toBe(true);
    expect(issues.some((i) => i.severity === 'error')).toBe(true);
  });

  it('flags missing_types_entry when types is absent', () => {
    const artifact = makePackageJson('alpha', { types: undefined });
    const issues = ConfigurationAnalyzer.analyzePackageJsons([artifact]);
    expect(issues.some((i) => i.issueType === 'missing_types_entry')).toBe(true);
  });

  it('flags missing_test_script when scripts.test is absent', () => {
    const artifact = makePackageJson('alpha', { scripts: {} });
    const issues = ConfigurationAnalyzer.analyzePackageJsons([artifact]);
    expect(issues.some((i) => i.issueType === 'missing_test_script')).toBe(true);
    expect(issues.some((i) => i.severity === 'warning')).toBe(true);
  });

  it('flags both main and types missing simultaneously', () => {
    const artifact = makePackageJson('alpha', { main: undefined, types: undefined });
    const issues = ConfigurationAnalyzer.analyzePackageJsons([artifact]);
    expect(issues).toHaveLength(2);
  });
});

// ===========================================================================
// 5. ConfigurationAnalyzer — Cross-package setting divergence
// ===========================================================================
describe('ConfigurationAnalyzer — detectSettingDivergence', () => {
  it('flags divergence when strict differs across two tsconfigs', () => {
    const artifacts = [
      makeTSConfig('alpha', { strict: true }),
      makeTSConfig('beta',  { strict: false }),
    ];
    const issues = ConfigurationAnalyzer.detectSettingDivergence(artifacts);
    expect(issues.some((i) => i.issueType === 'setting_divergence')).toBe(true);
    expect(issues[0].conflictKey).toBe('strict');
  });

  it('flags divergence when target differs across tsconfigs', () => {
    const artifacts = [
      makeTSConfig('alpha', { target: 'ES2022' }),
      makeTSConfig('beta',  { target: 'ESNext' }),
    ];
    const issues = ConfigurationAnalyzer.detectSettingDivergence(artifacts);
    expect(issues.some((i) => i.conflictKey === 'target')).toBe(true);
  });

  it('returns no divergence issues when all tsconfigs agree', () => {
    const artifacts = [
      makeTSConfig('alpha'),
      makeTSConfig('beta'),
    ];
    const issues = ConfigurationAnalyzer.detectSettingDivergence(artifacts);
    expect(issues.filter((i) => i.issueType === 'setting_divergence')).toHaveLength(0);
  });

  it('does not flag divergence for a single tsconfig', () => {
    const issues = ConfigurationAnalyzer.detectSettingDivergence([makeTSConfig('solo')]);
    expect(issues.filter((i) => i.issueType === 'setting_divergence')).toHaveLength(0);
  });
});

// ===========================================================================
// 6. ConfigurationAnalyzer — Path alias mismatch detection
// ===========================================================================
describe('ConfigurationAnalyzer — detectPathAliasMismatches', () => {
  it('flags a mismatch when the same alias maps to different targets', () => {
    const artifacts = [
      {
        ...makeTSConfig('alpha'),
        settings: { compilerOptions: { paths: { '@lib/*': ['./src/lib/*'] } } },
      },
      {
        ...makeTSConfig('beta'),
        settings: { compilerOptions: { paths: { '@lib/*': ['./lib/*'] } } },
      },
    ];
    const issues = ConfigurationAnalyzer.detectPathAliasMismatches(artifacts);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('path_alias_mismatch');
    expect(issues[0].severity).toBe('error');
  });

  it('returns no issues when all aliases are consistent', () => {
    const artifacts = [
      {
        ...makeTSConfig('alpha'),
        settings: { compilerOptions: { paths: { '@lib/*': ['./src/lib/*'] } } },
      },
      {
        ...makeTSConfig('beta'),
        settings: { compilerOptions: { paths: { '@lib/*': ['./src/lib/*'] } } },
      },
    ];
    expect(ConfigurationAnalyzer.detectPathAliasMismatches(artifacts)).toHaveLength(0);
  });

  it('returns no issues when no tsconfigs define paths', () => {
    const artifacts = [makeTSConfig('alpha'), makeTSConfig('beta')];
    expect(ConfigurationAnalyzer.detectPathAliasMismatches(artifacts)).toHaveLength(0);
  });

  it('flags multiple mismatched aliases independently', () => {
    const artifacts = [
      {
        ...makeTSConfig('alpha'),
        settings: {
          compilerOptions: {
            paths: { '@lib/*': ['./src/lib/*'], '@utils/*': ['./src/utils/*'] },
          },
        },
      },
      {
        ...makeTSConfig('beta'),
        settings: {
          compilerOptions: {
            paths: { '@lib/*': ['./lib/*'], '@utils/*': ['./utilities/*'] },
          },
        },
      },
    ];
    const issues = ConfigurationAnalyzer.detectPathAliasMismatches(artifacts);
    expect(issues).toHaveLength(2);
  });
});

// ===========================================================================
// 7. ConfigurationValidator
// ===========================================================================
describe('ConfigurationValidator — assessIssues', () => {
  it('returns zero counts for an empty issue list', () => {
    const assessment = ConfigurationValidator.assessIssues([]);
    expect(assessment.totalIssues).toBe(0);
    expect(assessment.warningCount).toBe(0);
    expect(assessment.errorCount).toBe(0);
  });

  it('correctly counts mixed severity issues', () => {
    const artifacts = [
      makeTSConfig('a', { strict: false }),      // warning
      makePackageJson('b', { main: undefined }), // error
    ];
    const issues = [
      ...ConfigurationAnalyzer.analyzeTSConfigs([artifacts[0]]),
      ...ConfigurationAnalyzer.analyzePackageJsons([artifacts[1]]),
    ];
    const assessment = ConfigurationValidator.assessIssues(issues);
    expect(assessment.warningCount).toBeGreaterThanOrEqual(1);
    expect(assessment.errorCount).toBeGreaterThanOrEqual(1);
    expect(assessment.totalIssues).toBe(issues.length);
  });

  it('populates byType correctly', () => {
    const artifact = makePackageJson('alpha', { main: undefined });
    const issues = ConfigurationAnalyzer.analyzePackageJsons([artifact]);
    const assessment = ConfigurationValidator.assessIssues(issues);
    expect(assessment.byType['missing_main_entry']).toBeDefined();
    expect(assessment.byType['missing_main_entry']!.length).toBe(1);
  });

  it('populates byTool correctly', () => {
    const artifact = makeTSConfig('alpha', { strict: false });
    const issues = ConfigurationAnalyzer.analyzeTSConfigs([artifact]);
    const assessment = ConfigurationValidator.assessIssues(issues);
    expect(assessment.byTool['tsconfig']).toBeDefined();
  });
});

describe('ConfigurationValidator — sortBySeverity', () => {
  it('orders critical before error before warning before info', () => {
    const issues = [
      ...ConfigurationAnalyzer.detectMissingConfigs([makeTSConfig('a', {}, false)]),  // error
      ...ConfigurationAnalyzer.analyzeTSConfigs([makeTSConfig('b', { strict: false })]), // warning
    ];
    const sorted = ConfigurationValidator.sortBySeverity(issues);
    const severities = sorted.map((i) => i.severity);
    const order = ['critical', 'error', 'warning', 'info'];
    for (let i = 1; i < severities.length; i++) {
      expect(order.indexOf(severities[i])).toBeGreaterThanOrEqual(order.indexOf(severities[i - 1]));
    }
  });
});

describe('ConfigurationValidator — filterConflicts', () => {
  it('returns only conflict-type issues', () => {
    const artifacts = [
      makeTSConfig('a', { strict: true }),
      makeTSConfig('b', { strict: false }),
    ];
    const allIssues = ConfigurationAnalyzer.analyzeAll(artifacts);
    const conflicts = ConfigurationValidator.filterConflicts(allIssues);
    expect(conflicts.every((i) =>
      ['setting_divergence', 'path_alias_mismatch', 'conflicting_configurations',
       'eslint_rule_conflict', 'prettier_option_conflict'].includes(i.issueType)
    )).toBe(true);
  });
});

describe('ConfigurationValidator — validateLimits', () => {
  it('passes all metrics for a fully compliant repository', () => {
    const artifacts = [makeTSConfig('alpha'), makePackageJson('alpha')];
    const metrics = ConfigurationValidator.validateLimits([], artifacts);
    expect(metrics.every((m) => m.passing)).toBe(true);
  });

  it('fails missingConfigCount when files are missing', () => {
    const artifact = makeTSConfig('alpha', {}, false);
    const issues = ConfigurationAnalyzer.detectMissingConfigs([artifact]);
    const metrics = ConfigurationValidator.validateLimits(issues, [artifact]);
    const metric = metrics.find((m) => m.metricName === 'missingConfigCount');
    expect(metric?.passing).toBe(false);
  });

  it('fails pathAliasMismatchCount when aliases conflict', () => {
    const artifacts = [
      { ...makeTSConfig('a'), settings: { compilerOptions: { paths: { '@x/*': ['./x/*'] } } } },
      { ...makeTSConfig('b'), settings: { compilerOptions: { paths: { '@x/*': ['./y/*'] } } } },
    ];
    const issues = ConfigurationAnalyzer.detectPathAliasMismatches(artifacts);
    const metrics = ConfigurationValidator.validateLimits(issues, artifacts);
    const metric = metrics.find((m) => m.metricName === 'pathAliasMismatchCount');
    expect(metric?.passing).toBe(false);
  });
});

// ===========================================================================
// 8. ConfigurationReportGenerator
// ===========================================================================
describe('ConfigurationReportGenerator — calculateScore', () => {
  it('returns 100 for a clean assessment', () => {
    const assessment = ConfigurationValidator.assessIssues([]);
    expect(ConfigurationReportGenerator.calculateScore(assessment)).toBe(100);
  });

  it('penalises errors (15 pts each)', () => {
    const artifact = makePackageJson('alpha', { main: undefined, types: undefined });
    const issues = ConfigurationAnalyzer.analyzePackageJsons([artifact]);
    const assessment = ConfigurationValidator.assessIssues(issues);
    // 2 errors = -30
    expect(ConfigurationReportGenerator.calculateScore(assessment)).toBe(70);
  });

  it('penalises warnings (5 pts each)', () => {
    const artifact = makeTSConfig('alpha', { strict: false, declaration: false });
    const issues = ConfigurationAnalyzer.analyzeTSConfigs([artifact]);
    const assessment = ConfigurationValidator.assessIssues(issues);
    // 2 warnings = -10
    expect(ConfigurationReportGenerator.calculateScore(assessment)).toBe(90);
  });

  it('never goes below 0', () => {
    const assessment = ConfigurationValidator.assessIssues([]);
    assessment.criticalCount = 100;
    expect(ConfigurationReportGenerator.calculateScore(assessment)).toBe(0);
  });
});

describe('ConfigurationReportGenerator — deriveGrade', () => {
  it('returns A+ for score >= 97', () => {
    expect(ConfigurationReportGenerator.deriveGrade(100)).toBe('A+');
    expect(ConfigurationReportGenerator.deriveGrade(97)).toBe('A+');
  });

  it('returns A for score 90–96', () => {
    expect(ConfigurationReportGenerator.deriveGrade(90)).toBe('A');
    expect(ConfigurationReportGenerator.deriveGrade(96)).toBe('A');
  });

  it('returns B for score 80–89', () => {
    expect(ConfigurationReportGenerator.deriveGrade(80)).toBe('B');
    expect(ConfigurationReportGenerator.deriveGrade(89)).toBe('B');
  });

  it('returns C for score 65–79', () => {
    expect(ConfigurationReportGenerator.deriveGrade(65)).toBe('C');
  });

  it('returns D for score 50–64', () => {
    expect(ConfigurationReportGenerator.deriveGrade(50)).toBe('D');
  });

  it('returns F for score < 50', () => {
    expect(ConfigurationReportGenerator.deriveGrade(0)).toBe('F');
    expect(ConfigurationReportGenerator.deriveGrade(49)).toBe('F');
  });
});

describe('ConfigurationReportGenerator — generateReport', () => {
  it('produces a valid report for a clean repository', () => {
    const assessment = ConfigurationValidator.assessIssues([]);
    const report = ConfigurationReportGenerator.generateReport(assessment, [], [], '.');
    expect(report.configurationHealthScore).toBe(100);
    expect(report.grade).toBe('A+');
    expect(report.issues).toHaveLength(0);
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('includes artifact summary', () => {
    const artifacts = [makeTSConfig('alpha'), makePackageJson('alpha')];
    const assessment = ConfigurationValidator.assessIssues([]);
    const report = ConfigurationReportGenerator.generateReport(assessment, [], artifacts, '.');
    expect(report.artifactSummary['tsconfig']).toBe(1);
    expect(report.artifactSummary['package_json']).toBe(1);
  });
});

describe('ConfigurationReportGenerator — toMarkdown', () => {
  it('contains the report heading', () => {
    const assessment = ConfigurationValidator.assessIssues([]);
    const report = ConfigurationReportGenerator.generateReport(assessment, [], []);
    const md = ConfigurationReportGenerator.toMarkdown(report);
    expect(md).toContain('# Configuration Intelligence Health Report');
  });

  it('lists issue types in the output', () => {
    const artifact = makePackageJson('alpha', { main: undefined });
    const issues = ConfigurationAnalyzer.analyzePackageJsons([artifact]);
    const assessment = ConfigurationValidator.assessIssues(issues);
    const report = ConfigurationReportGenerator.generateReport(assessment, issues, [artifact]);
    const md = ConfigurationReportGenerator.toMarkdown(report);
    expect(md).toContain('missing_main_entry');
  });
});

describe('ConfigurationReportGenerator — toJSON', () => {
  it('produces valid JSON with configurationHealthScore', () => {
    const assessment = ConfigurationValidator.assessIssues([]);
    const report = ConfigurationReportGenerator.generateReport(assessment, [], []);
    const json = ConfigurationReportGenerator.toJSON(report);
    expect(json).toContain('"configurationHealthScore"');
    expect(json).toContain('"grade"');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ===========================================================================
// 9. ConfigurationIntelligenceCLI
// ===========================================================================
describe('ConfigurationIntelligenceCLI', () => {
  it('defaults to help when no args provided', () => {
    expect(ConfigurationIntelligenceCLI.parseArgs([]).command).toBe('help');
  });

  it('parses analyze command', () => {
    expect(ConfigurationIntelligenceCLI.parseArgs(['analyze']).command).toBe('analyze');
  });

  it('parses validate command', () => {
    expect(ConfigurationIntelligenceCLI.parseArgs(['validate']).command).toBe('validate');
  });

  it('parses report command', () => {
    expect(ConfigurationIntelligenceCLI.parseArgs(['report']).command).toBe('report');
  });

  it('parses --target option', () => {
    const result = ConfigurationIntelligenceCLI.parseArgs(['analyze', '--target=packages/alpha']);
    expect(result.targetPath).toBe('packages/alpha');
  });

  it('parses --out option', () => {
    const result = ConfigurationIntelligenceCLI.parseArgs(['report', '--out=dist/report.md']);
    expect(result.outputPath).toBe('dist/report.md');
  });

  it('parses --format=json', () => {
    expect(ConfigurationIntelligenceCLI.parseArgs(['report', '--format=json']).format).toBe('json');
  });

  it('defaults to markdown format', () => {
    expect(ConfigurationIntelligenceCLI.parseArgs(['report']).format).toBe('markdown');
  });

  it('parses all options together', () => {
    const result = ConfigurationIntelligenceCLI.parseArgs([
      'report', '--target=.', '--format=json', '--out=health.json',
    ]);
    expect(result.command).toBe('report');
    expect(result.targetPath).toBe('.');
    expect(result.format).toBe('json');
    expect(result.outputPath).toBe('health.json');
  });

  it('help text includes all three commands', () => {
    const help = ConfigurationIntelligenceCLI.getHelpText();
    expect(help).toContain('analyze');
    expect(help).toContain('validate');
    expect(help).toContain('report');
  });

  it('help text documents all options', () => {
    const help = ConfigurationIntelligenceCLI.getHelpText();
    expect(help).toContain('--target');
    expect(help).toContain('--format');
    expect(help).toContain('--out');
  });
});

// ===========================================================================
// 10. analyzeAll — integration smoke test
// ===========================================================================
describe('ConfigurationAnalyzer — analyzeAll integration', () => {
  it('returns no issues for a fully compliant set of artifacts', () => {
    const artifacts = [
      makeTSConfig('alpha'),
      makePackageJson('alpha'),
    ];
    const issues = ConfigurationAnalyzer.analyzeAll(artifacts);
    // Might have info-level vitest coverage warning but no errors
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('returns combined issues from all analyzers for a broken set', () => {
    const artifacts = [
      makeTSConfig('broken', { strict: false }, true),    // warning
      makePackageJson('broken', { main: undefined }, true), // error
    ];
    const issues = ConfigurationAnalyzer.analyzeAll(artifacts);
    expect(issues.length).toBeGreaterThanOrEqual(2);
    expect(issues.some((i) => i.severity === 'error')).toBe(true);
    expect(issues.some((i) => i.severity === 'warning')).toBe(true);
  });
});
