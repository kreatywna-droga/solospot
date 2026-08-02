import { describe, it, expect } from 'vitest';
import {
  ApiSurfaceAnalyzer,
  ApiSurfaceValidator,
  ApiSurfaceReportGenerator,
  ApiSurfaceCLI,
} from './index';
import type { ApiExport, ApiSurface, ApiContract } from './index';

// ===========================================================================
// Fixture Factories
// ===========================================================================

function makeExport(
  symbolName: string,
  kind: ApiExport['kind'] = 'value',
  sourceFile = 'src/impl.ts',
  isDocumented = true
): Omit<ApiExport, 'isBarreled'> {
  return { symbolName, kind, sourceFile, hasImplementation: true, isDocumented };
}

function makeSurface(
  packageName: string,
  opts: {
    hasBarrel?: boolean;
    barreledExports?: Array<Omit<ApiExport, 'isBarreled'>>;
    implementationExports?: Array<Omit<ApiExport, 'isBarreled'>>;
  } = {}
): ApiSurface {
  const surfaces = ApiSurfaceAnalyzer.parseSurfaces([{
    packageName,
    barrelPath: `packages/${packageName}/src/index.ts`,
    hasBarrel: opts.hasBarrel ?? true,
    barreledExports: opts.barreledExports ?? [],
    implementationExports: opts.implementationExports ?? [],
  }]);
  return surfaces[0];
}

function makeContract(
  packageName: string,
  required: string[],
  forbidden: string[] = []
): ApiContract {
  return { packageName, requiredExports: required, forbiddenExports: forbidden, isDeclared: true };
}

// ===========================================================================
// 1. ApiSurfaceAnalyzer — parseSurfaces
// ===========================================================================
describe('ApiSurfaceAnalyzer — parseSurfaces', () => {
  it('converts raw package data to ApiSurface objects', () => {
    const surfaces = ApiSurfaceAnalyzer.parseSurfaces([{
      packageName: '@web-factor/foo',
      barrelPath: 'packages/foo/src/index.ts',
      hasBarrel: true,
      barreledExports: [makeExport('FooClass')],
      implementationExports: [makeExport('FooClass')],
    }]);
    expect(surfaces).toHaveLength(1);
    expect(surfaces[0].packageName).toBe('@web-factor/foo');
    expect(surfaces[0].barreledExports[0].isBarreled).toBe(true);
    expect(surfaces[0].implementationExports[0].isBarreled).toBe(false);
  });

  it('defaults hasBarrel to true when not provided', () => {
    const surfaces = ApiSurfaceAnalyzer.parseSurfaces([{
      packageName: '@web-factor/bar',
      barrelPath: 'packages/bar/src/index.ts',
    }]);
    expect(surfaces[0].hasBarrel).toBe(true);
  });
});

// ===========================================================================
// 2. ApiSurfaceAnalyzer — detectMissingBarrels (missing barrel detection)
// ===========================================================================
describe('ApiSurfaceAnalyzer — detectMissingBarrels', () => {
  it('flags a package with no barrel file', () => {
    const surface = makeSurface('@web-factor/no-barrel', { hasBarrel: false });
    const issues = ApiSurfaceAnalyzer.detectMissingBarrels([surface]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('missing_index_barrel');
    expect(issues[0].severity).toBe('error');
  });

  it('returns no issues when the barrel exists', () => {
    const surface = makeSurface('@web-factor/good', { hasBarrel: true });
    expect(ApiSurfaceAnalyzer.detectMissingBarrels([surface])).toHaveLength(0);
  });

  it('flags multiple packages without barrels', () => {
    const surfaces = [
      makeSurface('@web-factor/a', { hasBarrel: false }),
      makeSurface('@web-factor/b', { hasBarrel: false }),
    ];
    expect(ApiSurfaceAnalyzer.detectMissingBarrels(surfaces)).toHaveLength(2);
  });
});

// ===========================================================================
// 3. ApiSurfaceAnalyzer — detectMissingExports (missing export detection)
// ===========================================================================
describe('ApiSurfaceAnalyzer — detectMissingExports', () => {
  it('flags a symbol present in impl but absent from barrel', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [],
      implementationExports: [makeExport('MyClass')],
    });
    const issues = ApiSurfaceAnalyzer.detectMissingExports([surface]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('missing_export');
    expect(issues[0].symbolName).toBe('MyClass');
    expect(issues[0].severity).toBe('warning');
  });

  it('returns no issues when barrel and impl are in sync', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('MyClass')],
      implementationExports: [makeExport('MyClass')],
    });
    expect(ApiSurfaceAnalyzer.detectMissingExports([surface])).toHaveLength(0);
  });

  it('flags multiple missing symbols', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [],
      implementationExports: [makeExport('A'), makeExport('B'), makeExport('C')],
    });
    expect(ApiSurfaceAnalyzer.detectMissingExports([surface])).toHaveLength(3);
  });

  it('skips packages without a barrel', () => {
    const surface = makeSurface('@web-factor/no-barrel', {
      hasBarrel: false,
      implementationExports: [makeExport('Hidden')],
    });
    expect(ApiSurfaceAnalyzer.detectMissingExports([surface])).toHaveLength(0);
  });
});

// ===========================================================================
// 4. ApiSurfaceAnalyzer — detectDeadExports (dead export detection)
// ===========================================================================
describe('ApiSurfaceAnalyzer — detectDeadExports', () => {
  it('flags a symbol in barrel with no implementation', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('GhostClass')],
      implementationExports: [],
    });
    const issues = ApiSurfaceAnalyzer.detectDeadExports([surface]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('dead_export');
    expect(issues[0].symbolName).toBe('GhostClass');
    expect(issues[0].severity).toBe('error');
  });

  it('returns no issues when all barrel exports have implementations', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('RealClass')],
      implementationExports: [makeExport('RealClass')],
    });
    expect(ApiSurfaceAnalyzer.detectDeadExports([surface])).toHaveLength(0);
  });

  it('flags multiple dead exports simultaneously', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('Ghost1'), makeExport('Ghost2')],
      implementationExports: [],
    });
    expect(ApiSurfaceAnalyzer.detectDeadExports([surface])).toHaveLength(2);
  });
});

// ===========================================================================
// 5. ApiSurfaceAnalyzer — detectUnreachableModules
// ===========================================================================
describe('ApiSurfaceAnalyzer — detectUnreachableModules', () => {
  it('flags a source file with no symbols reaching the barrel', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('PublicClass', 'value', 'src/public.ts')],
      implementationExports: [
        makeExport('PublicClass', 'value', 'src/public.ts'),
        makeExport('InternalUtil', 'value', 'src/internal.ts'),
      ],
    });
    const issues = ApiSurfaceAnalyzer.detectUnreachableModules([surface]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('unreachable_module');
    expect(issues[0].targetPath).toBe('src/internal.ts');
  });

  it('returns no issues when all modules have at least one barreled symbol', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [
        makeExport('A', 'value', 'src/a.ts'),
        makeExport('B', 'value', 'src/b.ts'),
      ],
      implementationExports: [
        makeExport('A', 'value', 'src/a.ts'),
        makeExport('B', 'value', 'src/b.ts'),
      ],
    });
    expect(ApiSurfaceAnalyzer.detectUnreachableModules([surface])).toHaveLength(0);
  });
});

// ===========================================================================
// 6. ApiSurfaceAnalyzer — detectNamingInconsistencies
// ===========================================================================
describe('ApiSurfaceAnalyzer — detectNamingInconsistencies', () => {
  it('does not flag PascalCase names', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('MyService')],
      implementationExports: [],
    });
    expect(ApiSurfaceAnalyzer.detectNamingInconsistencies([surface])).toHaveLength(0);
  });

  it('does not flag camelCase names', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('myFunction')],
      implementationExports: [],
    });
    expect(ApiSurfaceAnalyzer.detectNamingInconsistencies([surface])).toHaveLength(0);
  });

  it('does not flag SCREAMING_SNAKE_CASE names', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('MY_CONSTANT')],
      implementationExports: [],
    });
    expect(ApiSurfaceAnalyzer.detectNamingInconsistencies([surface])).toHaveLength(0);
  });

  it('flags names with hyphens or spaces', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('my-function')],
      implementationExports: [],
    });
    const issues = ApiSurfaceAnalyzer.detectNamingInconsistencies([surface]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('naming_inconsistency');
  });
});

// ===========================================================================
// 7. ApiSurfaceAnalyzer — classifyChanges (breaking change classification)
// ===========================================================================
describe('ApiSurfaceAnalyzer — classifyChanges', () => {
  it('classifies removal of a public export as breaking', () => {
    const previous = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('OldClass'), makeExport('KeptClass')],
    });
    const current = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('KeptClass')],
    });
    const changes = ApiSurfaceAnalyzer.classifyChanges(previous, current);
    const removal = changes.find((c) => c.symbolName === 'OldClass');
    expect(removal?.kind).toBe('removal');
  });

  it('classifies addition of a new export as non-breaking', () => {
    const previous = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('Existing')],
    });
    const current = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('Existing'), makeExport('NewClass')],
    });
    const changes = ApiSurfaceAnalyzer.classifyChanges(previous, current);
    const addition = changes.find((c) => c.symbolName === 'NewClass');
    expect(addition?.kind).toBe('addition');
  });

  it('classifies kind change (value → type) as breaking', () => {
    const previous = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('Foo', 'value')],
    });
    const current = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('Foo', 'type')],
    });
    const changes = ApiSurfaceAnalyzer.classifyChanges(previous, current);
    const kindChange = changes.find((c) => c.symbolName === 'Foo');
    expect(kindChange?.kind).toBe('breaking');
  });

  it('returns no changes when the surfaces are identical', () => {
    const previous = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('Stable', 'value')],
    });
    const current = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('Stable', 'value')],
    });
    expect(ApiSurfaceAnalyzer.classifyChanges(previous, current)).toHaveLength(0);
  });

  it('converts breaking changes to error-severity issues', () => {
    const changes = [
      { packageName: '@web-factor/pkg', kind: 'removal' as const, symbolName: 'OldClass', description: 'removed' },
    ];
    const issues = ApiSurfaceAnalyzer.changesToIssues(changes);
    expect(issues[0].severity).toBe('error');
    expect(issues[0].isBreaking).toBe(true);
    expect(issues[0].issueType).toBe('breaking_change');
  });

  it('converts additions to info-severity issues', () => {
    const changes = [
      { packageName: '@web-factor/pkg', kind: 'addition' as const, symbolName: 'NewClass', description: 'added' },
    ];
    const issues = ApiSurfaceAnalyzer.changesToIssues(changes);
    expect(issues[0].severity).toBe('info');
    expect(issues[0].isBreaking).toBe(false);
    expect(issues[0].issueType).toBe('non_breaking_change');
  });
});

// ===========================================================================
// 8. ApiSurfaceAnalyzer — validateContract (contract compliance)
// ===========================================================================
describe('ApiSurfaceAnalyzer — validateContract', () => {
  it('emits critical issue when a required export is missing', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [],
    });
    const contract = makeContract('@web-factor/pkg', ['RequiredClass']);
    const issues = ApiSurfaceAnalyzer.validateContract(surface, contract);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('contract_violation');
    expect(issues[0].severity).toBe('critical');
    expect(issues[0].isBreaking).toBe(true);
  });

  it('emits error when a forbidden symbol is exported', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('__InternalHelper')],
    });
    const contract = makeContract('@web-factor/pkg', [], ['__InternalHelper']);
    const issues = ApiSurfaceAnalyzer.validateContract(surface, contract);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('policy_violation');
    expect(issues[0].severity).toBe('error');
  });

  it('returns no issues when contract is fully satisfied', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('PublicClass')],
    });
    const contract = makeContract('@web-factor/pkg', ['PublicClass'], []);
    expect(ApiSurfaceAnalyzer.validateContract(surface, contract)).toHaveLength(0);
  });

  it('can report both missing and forbidden issues simultaneously', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('ForbiddenSymbol')],
    });
    const contract = makeContract('@web-factor/pkg', ['RequiredClass'], ['ForbiddenSymbol']);
    const issues = ApiSurfaceAnalyzer.validateContract(surface, contract);
    expect(issues).toHaveLength(2);
    expect(issues.some((i) => i.issueType === 'contract_violation')).toBe(true);
    expect(issues.some((i) => i.issueType === 'policy_violation')).toBe(true);
  });
});

// ===========================================================================
// 9. ApiSurfaceValidator
// ===========================================================================
describe('ApiSurfaceValidator — assessIssues', () => {
  it('returns zero counts for an empty issue list', () => {
    const assessment = ApiSurfaceValidator.assessIssues([]);
    expect(assessment.totalIssues).toBe(0);
    expect(assessment.breakingChangeCount).toBe(0);
  });

  it('correctly counts breaking changes', () => {
    const surface = makeSurface('@web-factor/pkg', { barreledExports: [makeExport('Gone')] });
    const contract = makeContract('@web-factor/pkg', ['Gone']);
    const issues = ApiSurfaceAnalyzer.validateContract(surface, makeContract('@web-factor/pkg', ['Gone']));
    const breakingIssue = { ...issues[0], isBreaking: true };
    const assessment = ApiSurfaceValidator.assessIssues([breakingIssue]);
    expect(assessment.breakingChangeCount).toBe(1);
  });

  it('groups issues by package correctly', () => {
    const surfaceA = makeSurface('@web-factor/a', { barreledExports: [], implementationExports: [makeExport('X')] });
    const issues = ApiSurfaceAnalyzer.detectMissingExports([surfaceA]);
    const assessment = ApiSurfaceValidator.assessIssues(issues);
    expect(assessment.byPackage['@web-factor/a']).toBeDefined();
    expect(assessment.byPackage['@web-factor/a'].length).toBeGreaterThan(0);
  });

  it('groups issues by type correctly', () => {
    const surface = makeSurface('@web-factor/pkg', { barreledExports: [makeExport('Dead')], implementationExports: [] });
    const issues = ApiSurfaceAnalyzer.detectDeadExports([surface]);
    const assessment = ApiSurfaceValidator.assessIssues(issues);
    expect(assessment.byType['dead_export']).toBeDefined();
  });
});

describe('ApiSurfaceValidator — filterBreakingChanges', () => {
  it('returns only issues with isBreaking = true', () => {
    const change = { packageName: '@web-factor/pkg', kind: 'removal' as const, symbolName: 'X', description: 'X removed' };
    const allIssues = ApiSurfaceAnalyzer.changesToIssues([change]);
    const breaking = ApiSurfaceValidator.filterBreakingChanges(allIssues);
    expect(breaking.every((i) => i.isBreaking === true)).toBe(true);
    expect(breaking.length).toBeGreaterThan(0);
  });
});

describe('ApiSurfaceValidator — filterContractViolations', () => {
  it('returns only contract_violation and policy_violation issues', () => {
    const surface = makeSurface('@web-factor/pkg', { barreledExports: [makeExport('Bad')] });
    const contract = makeContract('@web-factor/pkg', ['Required'], ['Bad']);
    const issues = ApiSurfaceAnalyzer.validateContract(surface, contract);
    const violations = ApiSurfaceValidator.filterContractViolations(issues);
    expect(violations.length).toBe(issues.length);
  });
});

describe('ApiSurfaceValidator — validateLimits', () => {
  it('passes all metrics for a clean surface', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('MyClass')],
      implementationExports: [makeExport('MyClass')],
    });
    const metrics = ApiSurfaceValidator.validateLimits([], [surface]);
    expect(metrics.every((m) => m.passing)).toBe(true);
  });

  it('fails deadExportCount when dead exports are present', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('Ghost')],
      implementationExports: [],
    });
    const issues = ApiSurfaceAnalyzer.detectDeadExports([surface]);
    const metrics = ApiSurfaceValidator.validateLimits(issues, [surface]);
    const metric = metrics.find((m) => m.metricName === 'deadExportCount');
    expect(metric?.passing).toBe(false);
  });

  it('fails barrelCoverageRate when a package lacks a barrel', () => {
    const surface = makeSurface('@web-factor/no-barrel', { hasBarrel: false });
    const metrics = ApiSurfaceValidator.validateLimits([], [surface]);
    const metric = metrics.find((m) => m.metricName === 'barrelCoverageRate');
    expect(metric?.passing).toBe(false);
  });
});

// ===========================================================================
// 10. ApiSurfaceReportGenerator
// ===========================================================================
describe('ApiSurfaceReportGenerator — calculateScore', () => {
  it('returns 100 for a clean assessment', () => {
    const assessment = ApiSurfaceValidator.assessIssues([]);
    expect(ApiSurfaceReportGenerator.calculateScore(assessment)).toBe(100);
  });

  it('penalises errors (15 pts each)', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('Dead')],
      implementationExports: [],
    });
    const issues = ApiSurfaceAnalyzer.detectDeadExports([surface]);
    const assessment = ApiSurfaceValidator.assessIssues(issues);
    // 1 error = -15
    expect(ApiSurfaceReportGenerator.calculateScore(assessment)).toBe(85);
  });

  it('never goes below 0', () => {
    const assessment = ApiSurfaceValidator.assessIssues([]);
    assessment.criticalCount = 100;
    expect(ApiSurfaceReportGenerator.calculateScore(assessment)).toBe(0);
  });
});

describe('ApiSurfaceReportGenerator — deriveGrade', () => {
  it('returns A+ for score >= 97', () => {
    expect(ApiSurfaceReportGenerator.deriveGrade(100)).toBe('A+');
    expect(ApiSurfaceReportGenerator.deriveGrade(97)).toBe('A+');
  });

  it('returns A for score 90–96', () => {
    expect(ApiSurfaceReportGenerator.deriveGrade(90)).toBe('A');
  });

  it('returns B for score 80–89', () => {
    expect(ApiSurfaceReportGenerator.deriveGrade(80)).toBe('B');
  });

  it('returns F for score < 50', () => {
    expect(ApiSurfaceReportGenerator.deriveGrade(0)).toBe('F');
  });
});

describe('ApiSurfaceReportGenerator — generateReport', () => {
  it('produces a valid report for clean surfaces', () => {
    const assessment = ApiSurfaceValidator.assessIssues([]);
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('Clean')],
      implementationExports: [makeExport('Clean')],
    });
    const report = ApiSurfaceReportGenerator.generateReport(assessment, [], [surface]);
    expect(report.apiHealthScore).toBe(100);
    expect(report.grade).toBe('A+');
    expect(report.packageCount).toBe(1);
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('includes changes in the report', () => {
    const assessment = ApiSurfaceValidator.assessIssues([]);
    const changes = [
      { packageName: '@web-factor/pkg', kind: 'addition' as const, symbolName: 'NewClass', description: 'Added' },
    ];
    const report = ApiSurfaceReportGenerator.generateReport(assessment, [], [], changes);
    expect(report.changes).toHaveLength(1);
    expect(report.changes[0].symbolName).toBe('NewClass');
  });
});

describe('ApiSurfaceReportGenerator — toMarkdown', () => {
  it('contains the report heading', () => {
    const assessment = ApiSurfaceValidator.assessIssues([]);
    const report = ApiSurfaceReportGenerator.generateReport(assessment, [], []);
    const md = ApiSurfaceReportGenerator.toMarkdown(report);
    expect(md).toContain('# API Surface Intelligence Health Report');
  });

  it('includes issue types in the Markdown output', () => {
    const surface = makeSurface('@web-factor/pkg', {
      barreledExports: [makeExport('Dead')],
      implementationExports: [],
    });
    const issues = ApiSurfaceAnalyzer.detectDeadExports([surface]);
    const assessment = ApiSurfaceValidator.assessIssues(issues);
    const report = ApiSurfaceReportGenerator.generateReport(assessment, issues, [surface]);
    expect(ApiSurfaceReportGenerator.toMarkdown(report)).toContain('dead_export');
  });

  it('marks breaking issues with BREAKING label', () => {
    const changes = [
      { packageName: '@web-factor/pkg', kind: 'removal' as const, symbolName: 'OldClass', description: 'Removed' },
    ];
    const issues = ApiSurfaceAnalyzer.changesToIssues(changes);
    const assessment = ApiSurfaceValidator.assessIssues(issues);
    const report = ApiSurfaceReportGenerator.generateReport(assessment, issues, [], changes);
    const md = ApiSurfaceReportGenerator.toMarkdown(report);
    expect(md).toContain('BREAKING');
  });
});

describe('ApiSurfaceReportGenerator — toJSON', () => {
  it('produces valid JSON with apiHealthScore', () => {
    const assessment = ApiSurfaceValidator.assessIssues([]);
    const report = ApiSurfaceReportGenerator.generateReport(assessment, [], []);
    const json = ApiSurfaceReportGenerator.toJSON(report);
    expect(json).toContain('"apiHealthScore"');
    expect(json).toContain('"grade"');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ===========================================================================
// 11. ApiSurfaceCLI
// ===========================================================================
describe('ApiSurfaceCLI', () => {
  it('defaults to help when no args provided', () => {
    expect(ApiSurfaceCLI.parseArgs([]).command).toBe('help');
  });

  it('parses analyze command', () => {
    expect(ApiSurfaceCLI.parseArgs(['analyze']).command).toBe('analyze');
  });

  it('parses validate command', () => {
    expect(ApiSurfaceCLI.parseArgs(['validate']).command).toBe('validate');
  });

  it('parses report command', () => {
    expect(ApiSurfaceCLI.parseArgs(['report']).command).toBe('report');
  });

  it('parses --target option', () => {
    expect(ApiSurfaceCLI.parseArgs(['analyze', '--target=packages']).targetPath).toBe('packages');
  });

  it('parses --out option', () => {
    expect(ApiSurfaceCLI.parseArgs(['report', '--out=dist/report.md']).outputPath).toBe('dist/report.md');
  });

  it('parses --format=json', () => {
    expect(ApiSurfaceCLI.parseArgs(['report', '--format=json']).format).toBe('json');
  });

  it('defaults to markdown format', () => {
    expect(ApiSurfaceCLI.parseArgs(['report']).format).toBe('markdown');
  });

  it('parses all options together', () => {
    const result = ApiSurfaceCLI.parseArgs([
      'report', '--target=.', '--format=json', '--out=api-health.json',
    ]);
    expect(result.command).toBe('report');
    expect(result.targetPath).toBe('.');
    expect(result.format).toBe('json');
    expect(result.outputPath).toBe('api-health.json');
  });

  it('help text contains all commands', () => {
    const help = ApiSurfaceCLI.getHelpText();
    expect(help).toContain('analyze');
    expect(help).toContain('validate');
    expect(help).toContain('report');
  });

  it('help text documents all options', () => {
    const help = ApiSurfaceCLI.getHelpText();
    expect(help).toContain('--target');
    expect(help).toContain('--format');
    expect(help).toContain('--out');
  });
});

// ===========================================================================
// 12. analyzeAll — integration smoke test
// ===========================================================================
describe('ApiSurfaceAnalyzer — analyzeAll integration', () => {
  it('returns no errors for a fully compliant surface', () => {
    const surface = makeSurface('@web-factor/clean', {
      barreledExports: [makeExport('MyClass', 'value', 'src/my-class.ts', true)],
      implementationExports: [makeExport('MyClass', 'value', 'src/my-class.ts', true)],
    });
    const issues = ApiSurfaceAnalyzer.analyzeAll([surface]);
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
    expect(issues.filter((i) => i.severity === 'critical')).toHaveLength(0);
  });

  it('returns combined issues from all passes for a broken surface', () => {
    const surface = makeSurface('@web-factor/broken', {
      hasBarrel: false,
      barreledExports: [makeExport('Ghost')],
      implementationExports: [makeExport('Hidden')],
    });
    const issues = ApiSurfaceAnalyzer.analyzeAll([surface]);
    expect(issues.length).toBeGreaterThanOrEqual(1);
    expect(issues.some((i) => i.issueType === 'missing_index_barrel')).toBe(true);
  });
});
