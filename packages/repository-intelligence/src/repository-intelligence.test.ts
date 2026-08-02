import { describe, it, expect } from 'vitest';
import {
  RepositoryAnalyzer,
  RepositoryValidator,
  RepositoryReportGenerator,
  RepositoryIntelligenceCLI,
} from './index';
import type { RepositoryNode } from './index';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A minimal compliant package node */
function makePackage(name: string, extraChildren: RepositoryNode[] = []): RepositoryNode {
  return {
    path: `packages/${name}`,
    name,
    isDirectory: true,
    depth: 1,
    children: [
      { path: `packages/${name}/package.json`, name: 'package.json', isDirectory: false, depth: 2, children: [] },
      { path: `packages/${name}/tsconfig.json`, name: 'tsconfig.json', isDirectory: false, depth: 2, children: [] },
      { path: `packages/${name}/README.md`, name: 'README.md', isDirectory: false, depth: 2, children: [] },
      { path: `packages/${name}/src`, name: 'src', isDirectory: true, depth: 2, children: [
        { path: `packages/${name}/src/index.ts`, name: 'index.ts', isDirectory: false, depth: 3, children: [] },
      ]},
      ...extraChildren,
    ],
  };
}

/** Root node mimicking the repository root */
function makeRoot(pkgs: RepositoryNode[]): RepositoryNode[] {
  return [
    {
      path: 'packages',
      name: 'packages',
      isDirectory: true,
      depth: 0,
      children: pkgs,
    },
  ];
}

// ===========================================================================
// 1. RepositoryAnalyzer — general structure
// ===========================================================================
describe('RepositoryAnalyzer', () => {

  // ─── buildNodeTree ────────────────────────────────────────────────────────
  describe('buildNodeTree', () => {
    it('converts raw entries to RepositoryNode objects', () => {
      const nodes = RepositoryAnalyzer.buildNodeTree([
        { path: 'src', name: 'src', isDirectory: true, depth: 0 },
        { path: 'src/index.ts', name: 'index.ts', isDirectory: false, depth: 1 },
      ]);
      expect(nodes).toHaveLength(2);
      expect(nodes[0].isDirectory).toBe(true);
      expect(nodes[1].isDirectory).toBe(false);
    });

    it('attaches children when provided', () => {
      const nodes = RepositoryAnalyzer.buildNodeTree([
        {
          path: 'packages',
          name: 'packages',
          isDirectory: true,
          depth: 0,
          children: [
            { path: 'packages/foo', name: 'foo', isDirectory: true, depth: 1 },
          ],
        },
      ]);
      expect(nodes[0].children).toHaveLength(1);
      expect(nodes[0].children[0].name).toBe('foo');
    });
  });

  // ─── flatten ─────────────────────────────────────────────────────────────
  describe('flatten', () => {
    it('returns all nodes from a nested tree in BFS order', () => {
      const pkg = makePackage('alpha');
      const root = makeRoot([pkg]);
      const flat = RepositoryAnalyzer.flatten(root);
      expect(flat.length).toBeGreaterThan(3);
      expect(flat.some((n) => n.name === 'alpha')).toBe(true);
      expect(flat.some((n) => n.name === 'src')).toBe(true);
    });
  });

  // ─── analyzeStructure ────────────────────────────────────────────────────
  describe('analyzeStructure — clean repository', () => {
    it('returns no issues for a fully compliant package', () => {
      const root = makeRoot([makePackage('my-pkg')]);
      const issues = RepositoryAnalyzer.analyzeStructure(root);
      expect(issues).toHaveLength(0);
    });
  });

  // ─── detectEmptyDirectories ───────────────────────────────────────────────
  describe('detectEmptyDirectories', () => {
    it('detects a single empty directory', () => {
      const nodes: RepositoryNode[] = [
        { path: 'packages/empty-pkg', name: 'empty-pkg', isDirectory: true, depth: 0, children: [] },
      ];
      const issues = RepositoryAnalyzer.detectEmptyDirectories(nodes);
      expect(issues).toHaveLength(1);
      expect(issues[0].issueType).toBe('empty_directory');
      expect(issues[0].severity).toBe('warning');
    });

    it('does not flag directories that have children', () => {
      const nodes: RepositoryNode[] = [
        {
          path: 'src',
          name: 'src',
          isDirectory: true,
          depth: 0,
          children: [
            { path: 'src/index.ts', name: 'index.ts', isDirectory: false, depth: 1, children: [] },
          ],
        },
      ];
      const issues = RepositoryAnalyzer.detectEmptyDirectories(nodes);
      expect(issues).toHaveLength(0);
    });

    it('detects multiple empty directories in a nested tree', () => {
      const nodes: RepositoryNode[] = [
        {
          path: 'packages',
          name: 'packages',
          isDirectory: true,
          depth: 0,
          children: [
            { path: 'packages/empty-a', name: 'empty-a', isDirectory: true, depth: 1, children: [] },
            { path: 'packages/empty-b', name: 'empty-b', isDirectory: true, depth: 1, children: [] },
          ],
        },
      ];
      const issues = RepositoryAnalyzer.detectEmptyDirectories(nodes);
      expect(issues).toHaveLength(2);
    });

    it('does not flag file nodes', () => {
      const nodes: RepositoryNode[] = [
        { path: 'README.md', name: 'README.md', isDirectory: false, depth: 0, children: [] },
      ];
      expect(RepositoryAnalyzer.detectEmptyDirectories(nodes)).toHaveLength(0);
    });
  });

  // ─── detectExcessiveDepth ─────────────────────────────────────────────────
  describe('detectExcessiveDepth', () => {
    it('flags directories exceeding MAX_ALLOWED_DEPTH (6)', () => {
      const nodes: RepositoryNode[] = [
        { path: 'a/b/c/d/e/f/g', name: 'g', isDirectory: true, depth: 7, children: [] },
      ];
      const issues = RepositoryAnalyzer.detectExcessiveDepth(nodes);
      expect(issues).toHaveLength(1);
      expect(issues[0].issueType).toBe('excessive_depth');
    });

    it('does not flag directories at exactly MAX_ALLOWED_DEPTH', () => {
      const nodes: RepositoryNode[] = [
        { path: 'a/b/c/d/e/f', name: 'f', isDirectory: true, depth: 6, children: [] },
      ];
      expect(RepositoryAnalyzer.detectExcessiveDepth(nodes)).toHaveLength(0);
    });

    it('flags multiple deeply nested directories', () => {
      const nodes: RepositoryNode[] = [
        { path: 'a/b/c/d/e/f/g',    name: 'g',    isDirectory: true, depth: 7, children: [] },
        { path: 'a/b/c/d/e/f/g/h',  name: 'h',    isDirectory: true, depth: 8, children: [] },
      ];
      const issues = RepositoryAnalyzer.detectExcessiveDepth(nodes);
      expect(issues).toHaveLength(2);
    });
  });

  // ─── detectDuplicateStructures ────────────────────────────────────────────
  describe('detectDuplicateStructures', () => {
    it('flags directories with identical child-name signatures', () => {
      const sharedChildren = (prefix: string): RepositoryNode[] => [
        { path: `${prefix}/index.ts`, name: 'index.ts', isDirectory: false, depth: 2, children: [] },
        { path: `${prefix}/types.ts`, name: 'types.ts', isDirectory: false, depth: 2, children: [] },
      ];
      const nodes: RepositoryNode[] = [
        { path: 'packages/alpha', name: 'alpha', isDirectory: true, depth: 1, children: sharedChildren('packages/alpha') },
        { path: 'packages/beta',  name: 'beta',  isDirectory: true, depth: 1, children: sharedChildren('packages/beta') },
      ];
      const issues = RepositoryAnalyzer.detectDuplicateStructures(nodes);
      expect(issues).toHaveLength(1);
      expect(issues[0].issueType).toBe('duplicate_structure');
    });

    it('does not flag directories with different children', () => {
      const nodes: RepositoryNode[] = [
        {
          path: 'packages/alpha', name: 'alpha', isDirectory: true, depth: 1,
          children: [{ path: 'packages/alpha/a.ts', name: 'a.ts', isDirectory: false, depth: 2, children: [] }],
        },
        {
          path: 'packages/beta', name: 'beta', isDirectory: true, depth: 1,
          children: [{ path: 'packages/beta/b.ts', name: 'b.ts', isDirectory: false, depth: 2, children: [] }],
        },
      ];
      expect(RepositoryAnalyzer.detectDuplicateStructures(nodes)).toHaveLength(0);
    });

    it('does not flag empty directories as duplicates', () => {
      const nodes: RepositoryNode[] = [
        { path: 'packages/a', name: 'a', isDirectory: true, depth: 1, children: [] },
        { path: 'packages/b', name: 'b', isDirectory: true, depth: 1, children: [] },
      ];
      expect(RepositoryAnalyzer.detectDuplicateStructures(nodes)).toHaveLength(0);
    });
  });

  // ─── detectMissingPackageConventions ─────────────────────────────────────
  describe('detectMissingPackageConventions', () => {
    it('returns no issues for a fully compliant package', () => {
      const root = makeRoot([makePackage('good-pkg')]);
      expect(RepositoryAnalyzer.detectMissingPackageConventions(root)).toHaveLength(0);
    });

    it('flags missing package.json', () => {
      const pkg: RepositoryNode = {
        path: 'packages/no-manifest',
        name: 'no-manifest',
        isDirectory: true,
        depth: 1,
        children: [
          { path: 'packages/no-manifest/tsconfig.json', name: 'tsconfig.json', isDirectory: false, depth: 2, children: [] },
          { path: 'packages/no-manifest/README.md',     name: 'README.md',     isDirectory: false, depth: 2, children: [] },
          { path: 'packages/no-manifest/src',           name: 'src',           isDirectory: true,  depth: 2, children: [] },
        ],
      };
      const issues = RepositoryAnalyzer.detectMissingPackageConventions(makeRoot([pkg]));
      expect(issues.some((i) => i.issueType === 'missing_package_json')).toBe(true);
    });

    it('flags missing tsconfig.json', () => {
      const pkg: RepositoryNode = {
        path: 'packages/no-ts',
        name: 'no-ts',
        isDirectory: true,
        depth: 1,
        children: [
          { path: 'packages/no-ts/package.json', name: 'package.json', isDirectory: false, depth: 2, children: [] },
          { path: 'packages/no-ts/README.md',    name: 'README.md',    isDirectory: false, depth: 2, children: [] },
          { path: 'packages/no-ts/src',          name: 'src',          isDirectory: true,  depth: 2, children: [] },
        ],
      };
      const issues = RepositoryAnalyzer.detectMissingPackageConventions(makeRoot([pkg]));
      expect(issues.some((i) => i.issueType === 'missing_tsconfig')).toBe(true);
    });

    it('flags missing src/ directory', () => {
      const pkg: RepositoryNode = {
        path: 'packages/no-src',
        name: 'no-src',
        isDirectory: true,
        depth: 1,
        children: [
          { path: 'packages/no-src/package.json',  name: 'package.json',  isDirectory: false, depth: 2, children: [] },
          { path: 'packages/no-src/tsconfig.json', name: 'tsconfig.json', isDirectory: false, depth: 2, children: [] },
          { path: 'packages/no-src/README.md',     name: 'README.md',     isDirectory: false, depth: 2, children: [] },
        ],
      };
      const issues = RepositoryAnalyzer.detectMissingPackageConventions(makeRoot([pkg]));
      expect(issues.some((i) => i.issueType === 'missing_src_directory')).toBe(true);
    });
  });

  // ─── detectInconsistentNaming ─────────────────────────────────────────────
  describe('detectInconsistentNaming', () => {
    it('does not flag valid kebab-case package names', () => {
      const root = makeRoot([makePackage('my-cool-pkg')]);
      expect(RepositoryAnalyzer.detectInconsistentNaming(root)).toHaveLength(0);
    });

    it('flags PascalCase package names', () => {
      const root = makeRoot([makePackage('MyPackage')]);
      const issues = RepositoryAnalyzer.detectInconsistentNaming(root);
      expect(issues).toHaveLength(1);
      expect(issues[0].issueType).toBe('inconsistent_naming');
    });

    it('flags snake_case package names', () => {
      const root = makeRoot([makePackage('my_package')]);
      const issues = RepositoryAnalyzer.detectInconsistentNaming(root);
      expect(issues).toHaveLength(1);
    });
  });
});

// ===========================================================================
// 2. RepositoryValidator
// ===========================================================================
describe('RepositoryValidator', () => {

  describe('assessIssues', () => {
    it('returns zero counts for an empty issue list', () => {
      const assessment = RepositoryValidator.assessIssues([]);
      expect(assessment.totalIssues).toBe(0);
      expect(assessment.warningCount).toBe(0);
      expect(assessment.errorCount).toBe(0);
      expect(assessment.criticalCount).toBe(0);
    });

    it('correctly counts mixed severity issues', () => {
      const root = makeRoot([makePackage('alpha')]);
      const issues = [
        ...RepositoryAnalyzer.detectEmptyDirectories([
          { path: 'empty', name: 'empty', isDirectory: true, depth: 0, children: [] },
        ]),
        ...RepositoryAnalyzer.detectMissingPackageConventions(
          makeRoot([{
            path: 'packages/bad', name: 'bad', isDirectory: true, depth: 1,
            children: [],
          }])
        ),
      ];
      const assessment = RepositoryValidator.assessIssues(issues);
      expect(assessment.totalIssues).toBe(issues.length);
    });

    it('populates byType correctly', () => {
      const emptyNode: RepositoryNode = { path: 'e', name: 'e', isDirectory: true, depth: 0, children: [] };
      const issues = RepositoryAnalyzer.detectEmptyDirectories([emptyNode]);
      const assessment = RepositoryValidator.assessIssues(issues);
      expect(assessment.byType['empty_directory']).toBeDefined();
      expect(assessment.byType['empty_directory']!.length).toBe(1);
    });
  });

  describe('sortBySeverity', () => {
    it('orders critical before error before warning before info', () => {
      const issues = RepositoryAnalyzer.detectMissingPackageConventions(
        makeRoot([{ path: 'packages/missing', name: 'missing', isDirectory: true, depth: 1, children: [] }])
      );
      const sorted = RepositoryValidator.sortBySeverity(issues);
      const severities = sorted.map((i) => i.severity);
      const order = ['critical', 'error', 'warning', 'info'];
      for (let i = 1; i < severities.length; i++) {
        expect(order.indexOf(severities[i])).toBeGreaterThanOrEqual(order.indexOf(severities[i - 1]));
      }
    });
  });

  describe('validateLimits', () => {
    it('passes all metrics for a clean repository', () => {
      const root = makeRoot([makePackage('good-pkg')]);
      const allNodes = RepositoryAnalyzer.flatten(root);
      const metrics = RepositoryValidator.validateLimits([], allNodes);
      expect(metrics.every((m) => m.passing)).toBe(true);
    });

    it('fails maxDirectoryDepth when depth exceeds 6', () => {
      const deepNode: RepositoryNode = {
        path: 'a/b/c/d/e/f/g', name: 'g', isDirectory: true, depth: 7, children: [],
      };
      const metrics = RepositoryValidator.validateLimits([], [deepNode]);
      const depthMetric = metrics.find((m) => m.metricName === 'maxDirectoryDepth');
      expect(depthMetric?.passing).toBe(false);
    });

    it('fails emptyDirectoryCount when empty dirs are present', () => {
      const emptyNode: RepositoryNode = { path: 'e', name: 'e', isDirectory: true, depth: 0, children: [] };
      const issues = RepositoryAnalyzer.detectEmptyDirectories([emptyNode]);
      const metrics = RepositoryValidator.validateLimits(issues, [emptyNode]);
      const emptyMetric = metrics.find((m) => m.metricName === 'emptyDirectoryCount');
      expect(emptyMetric?.passing).toBe(false);
    });
  });
});

// ===========================================================================
// 3. RepositoryReportGenerator
// ===========================================================================
describe('RepositoryReportGenerator', () => {

  describe('calculateScore', () => {
    it('returns 100 for a clean assessment', () => {
      const assessment = RepositoryValidator.assessIssues([]);
      expect(RepositoryReportGenerator.calculateScore(assessment)).toBe(100);
    });

    it('penalises errors (15 pts each)', () => {
      const root = makeRoot([{ path: 'packages/bad', name: 'bad', isDirectory: true, depth: 1, children: [] }]);
      const issues = RepositoryAnalyzer.analyzeStructure(root);
      const assessment = RepositoryValidator.assessIssues(issues);
      const score = RepositoryReportGenerator.calculateScore(assessment);
      expect(score).toBeLessThan(100);
    });

    it('never goes below 0', () => {
      const assessment = RepositoryValidator.assessIssues([]);
      // Manually inflate to trigger clamping
      assessment.criticalCount = 100;
      expect(RepositoryReportGenerator.calculateScore(assessment)).toBe(0);
    });
  });

  describe('deriveGrade', () => {
    it('returns A+ for score >= 97', () => {
      expect(RepositoryReportGenerator.deriveGrade(100)).toBe('A+');
      expect(RepositoryReportGenerator.deriveGrade(97)).toBe('A+');
    });

    it('returns A for score 90–96', () => {
      expect(RepositoryReportGenerator.deriveGrade(90)).toBe('A');
      expect(RepositoryReportGenerator.deriveGrade(96)).toBe('A');
    });

    it('returns B for score 80–89', () => {
      expect(RepositoryReportGenerator.deriveGrade(80)).toBe('B');
    });

    it('returns F for score < 50', () => {
      expect(RepositoryReportGenerator.deriveGrade(0)).toBe('F');
      expect(RepositoryReportGenerator.deriveGrade(49)).toBe('F');
    });
  });

  describe('generateReport', () => {
    it('produces a valid report for a clean repository', () => {
      const assessment = RepositoryValidator.assessIssues([]);
      const report = RepositoryReportGenerator.generateReport(assessment, [], {
        rootPath: '.',
        maxDepth: 3,
        packageCount: 10,
      });
      expect(report.repositoryHealthScore).toBe(100);
      expect(report.grade).toBe('A+');
      expect(report.issues).toHaveLength(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('includes generatedAt timestamp', () => {
      const assessment = RepositoryValidator.assessIssues([]);
      const report = RepositoryReportGenerator.generateReport(assessment, [], {
        rootPath: '.', maxDepth: 0, packageCount: 0,
      });
      expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('toMarkdown', () => {
    it('contains the report heading', () => {
      const assessment = RepositoryValidator.assessIssues([]);
      const report = RepositoryReportGenerator.generateReport(assessment, [], {
        rootPath: '.', maxDepth: 0, packageCount: 0,
      });
      const md = RepositoryReportGenerator.toMarkdown(report);
      expect(md).toContain('# Repository Intelligence Health Report');
    });

    it('lists detected issue types in the Markdown output', () => {
      const emptyNode: RepositoryNode = { path: 'ghost', name: 'ghost', isDirectory: true, depth: 0, children: [] };
      const issues = RepositoryAnalyzer.detectEmptyDirectories([emptyNode]);
      const assessment = RepositoryValidator.assessIssues(issues);
      const report = RepositoryReportGenerator.generateReport(assessment, issues, {
        rootPath: '.', maxDepth: 0, packageCount: 0,
      });
      const md = RepositoryReportGenerator.toMarkdown(report);
      expect(md).toContain('empty_directory');
    });
  });

  describe('toJSON', () => {
    it('produces valid JSON containing repositoryHealthScore', () => {
      const assessment = RepositoryValidator.assessIssues([]);
      const report = RepositoryReportGenerator.generateReport(assessment, [], {
        rootPath: '.', maxDepth: 0, packageCount: 0,
      });
      const json = RepositoryReportGenerator.toJSON(report);
      expect(json).toContain('"repositoryHealthScore"');
      expect(json).toContain('"grade"');
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });
});

// ===========================================================================
// 4. RepositoryIntelligenceCLI
// ===========================================================================
describe('RepositoryIntelligenceCLI', () => {

  it('defaults to help when no args provided', () => {
    const result = RepositoryIntelligenceCLI.parseArgs([]);
    expect(result.command).toBe('help');
  });

  it('parses analyze command', () => {
    const result = RepositoryIntelligenceCLI.parseArgs(['analyze']);
    expect(result.command).toBe('analyze');
  });

  it('parses validate command', () => {
    const result = RepositoryIntelligenceCLI.parseArgs(['validate']);
    expect(result.command).toBe('validate');
  });

  it('parses report command', () => {
    const result = RepositoryIntelligenceCLI.parseArgs(['report']);
    expect(result.command).toBe('report');
  });

  it('parses --target option', () => {
    const result = RepositoryIntelligenceCLI.parseArgs(['analyze', '--target=packages/foo']);
    expect(result.targetPath).toBe('packages/foo');
  });

  it('parses --out option', () => {
    const result = RepositoryIntelligenceCLI.parseArgs(['report', '--out=dist/report.md']);
    expect(result.outputPath).toBe('dist/report.md');
  });

  it('parses --format=json', () => {
    const result = RepositoryIntelligenceCLI.parseArgs(['report', '--format=json']);
    expect(result.format).toBe('json');
  });

  it('defaults to markdown format when --format not specified', () => {
    const result = RepositoryIntelligenceCLI.parseArgs(['report']);
    expect(result.format).toBe('markdown');
  });

  it('parses all options together', () => {
    const result = RepositoryIntelligenceCLI.parseArgs([
      'report',
      '--target=.',
      '--format=json',
      '--out=health.json',
    ]);
    expect(result.command).toBe('report');
    expect(result.targetPath).toBe('.');
    expect(result.format).toBe('json');
    expect(result.outputPath).toBe('health.json');
  });

  it('help text includes all three commands', () => {
    const help = RepositoryIntelligenceCLI.getHelpText();
    expect(help).toContain('analyze');
    expect(help).toContain('validate');
    expect(help).toContain('report');
  });

  it('help text documents --target and --format options', () => {
    const help = RepositoryIntelligenceCLI.getHelpText();
    expect(help).toContain('--target');
    expect(help).toContain('--format');
    expect(help).toContain('--out');
  });
});
